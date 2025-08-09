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
}

export class NetworkLoggerCDP {
    private driver?: WebDriver;
    private logDir: string;
    private requests: NetworkRequest[] = [];
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
                            requestBody: params.request.postData
                        };
                        
                        // Save request immediately
                        await this.saveRequest(request);
                        this.requests.push(request);
                        
                        // Log to console
                        console.log(`[${request.method}] ${request.url}`);
                    } else if (method === 'Network.responseReceived') {
                        const response = params.response;
                        
                        // Find matching request and update it
                        const matchingRequest = this.requests.find(r => r.url === response.url);
                        if (matchingRequest) {
                            matchingRequest.responseStatus = response.status;
                            matchingRequest.responseHeaders = response.headers;
                            matchingRequest.type = response.mimeType;
                            
                            // Log response to console
                            console.log(`  └─ Response: ${response.status} (${response.mimeType})`);
                            
                            // Update saved request
                            await this.saveRequest(matchingRequest);
                        }
                    } else if (method === 'Network.loadingFinished') {
                        // Update request with final size information
                        const requestId = params.requestId;
                        const encodedDataLength = params.encodedDataLength;
                        
                        // Find request by requestId if we were tracking it
                        const matchingRequest = this.requests[this.requests.length - 1];
                        if (matchingRequest && encodedDataLength) {
                            matchingRequest.size = encodedDataLength;
                            await this.saveRequest(matchingRequest);
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

    private async saveRequest(request: NetworkRequest): Promise<void> {
        try {
            const filename = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
            const filepath = path.join(this.logDir, filename);
            await fs.writeFile(filepath, JSON.stringify(request, null, 2));
            
            // Also update the index file
            await this.updateIndex(request);
        } catch (error) {
            console.warn('Failed to save network request:', error);
        }
    }

    private async updateIndex(request: NetworkRequest): Promise<void> {
        const indexFile = path.join(this.logDir, 'index.json');
        let index: any = { requests: [] };

        try {
            const existing = await fs.readFile(indexFile, 'utf-8');
            index = JSON.parse(existing);
        } catch {
            // File doesn't exist yet
        }

        index.requests.push({
            timestamp: request.timestamp,
            url: request.url,
            method: request.method,
            status: request.responseStatus,
            type: request.type,
            size: request.size
        });

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