import { WebDriver, logging } from 'selenium-webdriver';
import fs from 'fs/promises';
import path from 'path';

export interface NetworkRequest {
    url: string;
    method: string;
    headers?: Record<string, string | string[]>;
    requestBody?: string;
    responseStatus?: number;
    responseHeaders?: Record<string, string | string[]>;
    responseBody?: string;
    timestamp: string;
    duration?: number;
    type?: string;
    size?: number;
    requestId?: string;
    requestFilepath?: string;
    responseFilepath?: string;
}

export class NetworkLoggerCDP {
    private driver?: WebDriver;
    private logDir: string;
    private requests: NetworkRequest[] = [];
    private requestMap: Map<string, { request: NetworkRequest; filepath: string }> = new Map();
    private captureInterval?: NodeJS.Timeout;
    private isCapturing: boolean = false;

    constructor() {
        // Use project directory for logs instead of temp directory
        // Resolve from the current working directory (where the server is run from)
        const projectRoot = process.cwd();
        this.logDir = path.join(projectRoot, '.network-logs', Date.now().toString());
    }

    setDriver(driver: WebDriver) {
        this.driver = driver;
    }

    setLogDirectory(dir?: string) {
        if (dir) {
            this.logDir = dir;
        }
    }

    async startCapture(): Promise<void> {
        if (!this.driver) {
            throw new Error('WebDriver not set');
        }

        // Ensure log directory exists
        await fs.mkdir(this.logDir, { recursive: true });
        console.log(`Network logs will be saved to: ${this.logDir}`);

        this.isCapturing = true;
        
        // Capture logs every 500ms
        this.captureInterval = setInterval(async () => {
            if (this.isCapturing) {
                await this.captureLogs();
            }
        }, 500);
    }

    private async captureLogs(): Promise<void> {
        if (!this.driver) return;

        try {
            // Get performance logs from Chrome
            const logs = await this.driver.manage().logs().get(logging.Type.PERFORMANCE);
            
            for (const entry of logs) {
                try {
                    const message = JSON.parse(entry.message);
                    const method = message.message?.method;
                    const params = message.message?.params;

                    // Process network events
                    if (method === 'Network.requestWillBeSent') {
                        const request: NetworkRequest = {
                            url: params.request.url,
                            method: params.request.method,
                            headers: params.request.headers,
                            timestamp: new Date(params.wallTime * 1000).toISOString(),
                            requestBody: params.request.postData,
                            requestId: params.requestId
                        };
                        
                        // Save request immediately and get the filepath
                        const filepath = await this.saveRequest(request);
                        request.requestFilepath = filepath;
                        this.requests.push(request);
                        
                        // Store in map for later response matching
                        if (params.requestId) {
                            this.requestMap.set(params.requestId, { request, filepath });
                        }
                        
                        // Log to console
                        console.log(`[${request.method}] ${request.url}`);
                    } else if (method === 'Network.responseReceived') {
                        const response = params.response;
                        const requestId = params.requestId;
                        
                        // Find matching request by requestId
                        const requestData = this.requestMap.get(requestId);
                        if (requestData) {
                            const { request, filepath } = requestData;
                            
                            // Update request with response data
                            request.responseStatus = response.status;
                            request.responseHeaders = response.headers;
                            request.type = response.mimeType;
                            
                            // Try to get response body
                            let responseBody: string | undefined;
                            try {
                                // Execute CDP command to get response body using the correct method
                                const bodyResult = await (this.driver as any).sendAndGetDevToolsCommand('Network.getResponseBody', {
                                    requestId: requestId
                                });
                                responseBody = bodyResult.body;
                                
                                // Also update the request object with response body
                                request.responseBody = responseBody;
                            } catch (error) {
                                // Response body might not be available for all requests (e.g., redirects, non-text content)
                                // This is expected for some requests, so we just log as debug info
                                console.log(`  └─ Could not retrieve response body for ${response.url}`);
                            }
                            
                            // Save response to separate file with body
                            const responseFilepath = await this.saveResponse({
                                requestId,
                                url: response.url,
                                status: response.status,
                                headers: response.headers,
                                mimeType: response.mimeType,
                                body: responseBody,
                                timestamp: new Date().toISOString()
                            });
                            
                            // Update request with response filepath
                            request.responseFilepath = responseFilepath;
                            
                            // Update the request file
                            await fs.writeFile(filepath, JSON.stringify(request, null, 2));
                            
                            // Update index with both request and response paths
                            await this.updateIndex(request, filepath, responseFilepath);
                            
                            // Log response to console
                            console.log(`  └─ Response: ${response.status} (${response.mimeType})${responseBody ? ' [body captured]' : ''}`);
                        }
                    } else if (method === 'Network.loadingFinished') {
                        // Update request with final size information
                        const requestId = params.requestId;
                        const encodedDataLength = params.encodedDataLength;
                        
                        // Find request by requestId
                        const requestData = this.requestMap.get(requestId);
                        if (requestData && encodedDataLength) {
                            const { request, filepath } = requestData;
                            request.size = encodedDataLength;
                            
                            // Update the request file with size
                            await fs.writeFile(filepath, JSON.stringify(request, null, 2));
                        }
                    }
                } catch (parseError) {
                    // Ignore parse errors for non-network events
                }
            }
        } catch (error) {
            // Driver might be closed or logs not available
            if (this.isCapturing) {
                console.error('Failed to capture network logs:', error);
            }
        }
    }

    private async saveRequest(request: NetworkRequest): Promise<string> {
        const filename = `request_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.json`;
        const filepath = path.join(this.logDir, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(request, null, 2));
            return filepath;
        } catch (error) {
            console.error('Failed to save network request:', error);
            return filepath;
        }
    }
    
    private async saveResponse(response: any): Promise<string> {
        const filename = `response_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.json`;
        const filepath = path.join(this.logDir, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(response, null, 2));
            return filepath;
        } catch (error) {
            console.error('Failed to save network response:', error);
            return filepath;
        }
    }

    private async updateIndex(request: NetworkRequest, requestFilepath?: string, responseFilepath?: string): Promise<void> {
        const indexFile = path.join(this.logDir, 'index.json');
        let index: any = { requests: [] };

        try {
            const existing = await fs.readFile(indexFile, 'utf-8');
            index = JSON.parse(existing);
        } catch {
            // File doesn't exist yet
        }

        // Find existing entry or create new one
        const existingIndex = index.requests.findIndex((r: any) => 
            r.url === request.url && r.timestamp === request.timestamp
        );

        const entry = {
            timestamp: request.timestamp,
            url: request.url,
            method: request.method,
            status: request.responseStatus,
            type: request.type,
            size: request.size,
            requestFilepath: requestFilepath || undefined,
            responseFilepath: responseFilepath || undefined
        };

        if (existingIndex >= 0) {
            // Update existing entry
            index.requests[existingIndex] = { ...index.requests[existingIndex], ...entry };
        } else {
            // Add new entry
            index.requests.push(entry);
        }

        await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
    }

    async stopCapture(cleanup: boolean = true): Promise<void> {
        this.isCapturing = false;
        
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = undefined;
        }

        // Capture any remaining logs
        if (this.driver) {
            await this.captureLogs();
        }

        console.log(`Network capture stopped. Logs saved to: ${this.logDir}`);
        
        // Clean up the log directory if requested
        if (cleanup) {
            await this.cleanupLogs();
        }
    }
    
    async cleanupLogs(): Promise<void> {
        try {
            await fs.rm(this.logDir, { recursive: true, force: true });
            console.log(`Network logs cleaned up: ${this.logDir}`);
        } catch (error) {
            console.error(`Failed to clean up network logs at ${this.logDir}:`, error);
        }
    }

    getLogDirectory(): string {
        return this.logDir;
    }

    getRequests(): NetworkRequest[] {
        return this.requests;
    }
    
    async searchInFiles(pattern: string, useRegex: boolean = false, contextLines: number = 5): Promise<any[]> {
        const results: any[] = [];
        
        // Create matcher
        let matcher: (text: string) => boolean;
        if (useRegex) {
            const regex = new RegExp(pattern, 'gi');
            matcher = (text: string) => regex.test(text);
        } else {
            const lowerPattern = pattern.toLowerCase();
            matcher = (text: string) => text.toLowerCase().includes(lowerPattern);
        }
        
        // Search through request files
        for (const request of this.requests) {
            const matches: any[] = [];
            
            // Search in request file
            if (request.requestFilepath) {
                try {
                    const content = await fs.readFile(request.requestFilepath, 'utf-8');
                    const lines = content.split('\n');
                    
                    for (let i = 0; i < lines.length; i++) {
                        if (matcher(lines[i])) {
                            // Get context lines
                            const startLine = Math.max(0, i - contextLines);
                            const endLine = Math.min(lines.length - 1, i + contextLines);
                            const contextText = lines.slice(startLine, endLine + 1)
                                .map((line, idx) => `${startLine + idx + 1}: ${line}`)
                                .join('\n');
                            
                            matches.push({
                                type: 'request',
                                filepath: request.requestFilepath,
                                lineNumber: i + 1,
                                matchedLine: lines[i],
                                context: contextText
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to read request file ${request.requestFilepath}:`, error);
                }
            }
            
            // Search in response file
            if (request.responseFilepath) {
                try {
                    const content = await fs.readFile(request.responseFilepath, 'utf-8');
                    const lines = content.split('\n');
                    
                    for (let i = 0; i < lines.length; i++) {
                        if (matcher(lines[i])) {
                            // Get context lines
                            const startLine = Math.max(0, i - contextLines);
                            const endLine = Math.min(lines.length - 1, i + contextLines);
                            const contextText = lines.slice(startLine, endLine + 1)
                                .map((line, idx) => `${startLine + idx + 1}: ${line}`)
                                .join('\n');
                            
                            matches.push({
                                type: 'response',
                                filepath: request.responseFilepath,
                                lineNumber: i + 1,
                                matchedLine: lines[i],
                                context: contextText
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to read response file ${request.responseFilepath}:`, error);
                }
            }
            
            if (matches.length > 0) {
                results.push({
                    url: request.url,
                    method: request.method,
                    timestamp: request.timestamp,
                    status: request.responseStatus,
                    matches: matches
                });
            }
        }
        
        return results;
    }
}

// Global instance
let cdpLogger: NetworkLoggerCDP | null = null;

export const getNetworkLogger = (): NetworkLoggerCDP => {
    if (!cdpLogger) {
        cdpLogger = new NetworkLoggerCDP();
    }
    return cdpLogger;
};