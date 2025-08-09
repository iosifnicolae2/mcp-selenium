import { WebDriver, logging } from 'selenium-webdriver';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

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
}

export class NetworkLoggerCDP {
    private driver?: WebDriver;
    private logDir: string;
    private requests: NetworkRequest[] = [];
    private requestMap: Map<string, { request: NetworkRequest; filepath: string }> = new Map();
    private captureInterval?: NodeJS.Timeout;
    private isCapturing: boolean = false;

    constructor() {
        this.logDir = path.join(os.tmpdir(), 'mcp-selenium-network-logs', Date.now().toString());
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
                                // Execute CDP command to get response body
                                const bodyResult = await (this.driver as any).executeCdpCommand('Network.getResponseBody', {
                                    requestId: requestId
                                });
                                responseBody = bodyResult.body;
                                
                                // Also update the request object with response body
                                request.responseBody = responseBody;
                            } catch (error) {
                                // Response body might not be available for all requests (e.g., redirects, non-text content)
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
                console.warn('Failed to capture network logs:', error);
            }
        }
    }

    private async saveRequest(request: NetworkRequest): Promise<string> {
        const filename = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filepath = path.join(this.logDir, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(request, null, 2));
            return filepath;
        } catch (error) {
            console.warn('Failed to save network request:', error);
            return filepath;
        }
    }
    
    private async saveResponse(response: any): Promise<string> {
        const filename = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
        const filepath = path.join(this.logDir, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(response, null, 2));
            return filepath;
        } catch (error) {
            console.warn('Failed to save network response:', error);
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

    async stopCapture(): Promise<void> {
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
    }

    getLogDirectory(): string {
        return this.logDir;
    }

    getRequests(): NetworkRequest[] {
        return this.requests;
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