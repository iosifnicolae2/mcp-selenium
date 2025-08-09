import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { URL } from 'url';
import { IncomingMessage, ServerResponse } from 'http';

export interface NetworkRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    requestBody?: string;
    responseStatus?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    timestamp: string;
    duration?: number;
}

export interface NetworkLogIndex {
    currentUrl: string;
    requests: Array<{
        timestamp: string;
        requestFile: string;
        url: string;
        method: string;
        status?: number;
    }>;
}

export class NetworkLogger {
    private proxyPort: number;
    private server?: http.Server;
    private app: express.Application;
    private logDir: string;
    private currentUrl: string = '';
    private requests: Map<string, NetworkRequest> = new Map();
    private enabled: boolean = true;

    constructor(proxyPort: number = 8888) {
        this.proxyPort = proxyPort;
        this.app = express();
        this.logDir = path.join(os.tmpdir(), 'mcp-selenium-logs');
        this.setupProxyServer();
    }

    private async setupProxyServer() {
        // Ensure log directory exists
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.warn('Failed to create log directory:', error);
        }

        // Handle all HTTP requests
        this.app.use('*', (req: express.Request, res: express.Response) => {
            this.handleProxyRequest(req, res);
        });
    }

    private async handleProxyRequest(req: express.Request, res: express.Response) {
        if (!this.enabled) {
            res.status(500).send('Network logging disabled');
            return;
        }

        const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Parse the target URL from request
        const targetUrl = req.headers.host ? 
            `${req.protocol}://${req.headers.host}${req.url}` : 
            req.url;

        if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
            res.status(400).send('Invalid URL');
            return;
        }

        // Log the request
        const networkRequest: NetworkRequest = {
            url: targetUrl,
            method: req.method,
            headers: req.headers as Record<string, string>,
            requestBody: req.body ? JSON.stringify(req.body) : undefined,
            timestamp
        };

        this.requests.set(requestId, networkRequest);

        try {
            // Save request to file
            const requestFile = path.join(this.logDir, `request_${requestId}.json`);
            await fs.writeFile(requestFile, JSON.stringify(networkRequest, null, 2));

            // Make the actual request
            const parsedUrl = new URL(targetUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const proxyReq = client.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: req.method,
                headers: {
                    ...req.headers,
                    host: parsedUrl.host
                }
            }, (proxyRes) => {
                // Update request with response info
                networkRequest.responseStatus = proxyRes.statusCode;
                networkRequest.responseHeaders = proxyRes.headers as Record<string, string>;
                networkRequest.duration = Date.now() - new Date(timestamp).getTime();

                // Forward response headers
                Object.entries(proxyRes.headers).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(v => res.append(key, v));
                    } else if (value) {
                        res.set(key, value);
                    }
                });

                // Set status code
                res.status(proxyRes.statusCode || 200);

                let responseBody = '';
                
                // Collect response data
                proxyRes.on('data', (chunk) => {
                    responseBody += chunk.toString();
                    res.write(chunk);
                });

                proxyRes.on('end', async () => {
                    networkRequest.responseBody = responseBody;
                    
                    try {
                        // Save updated request with response
                        await fs.writeFile(requestFile, JSON.stringify(networkRequest, null, 2));
                        await this.updateIndex(requestId, networkRequest);
                    } catch (error) {
                        console.warn('Failed to save response:', error);
                    }
                    
                    res.end();
                });
            });

            proxyReq.on('error', (error) => {
                console.error('Proxy request error:', error);
                res.status(500).send(`Proxy error: ${error.message}`);
            });

            // Forward request body if present
            if (req.body) {
                proxyReq.write(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
            }

            proxyReq.end();
            
        } catch (error) {
            console.error('Failed to process proxy request:', error);
            res.status(500).send(`Error processing request: ${error}`);
        }
    }

    private async updateIndex(requestId: string, request: NetworkRequest) {
        const indexFile = path.join(this.logDir, 'index.json');
        let index: NetworkLogIndex;

        try {
            const indexContent = await fs.readFile(indexFile, 'utf-8');
            index = JSON.parse(indexContent);
        } catch {
            index = {
                currentUrl: this.currentUrl,
                requests: []
            };
        }

        index.currentUrl = this.currentUrl;
        index.requests.push({
            timestamp: request.timestamp,
            requestFile: `request_${requestId}.json`,
            url: request.url,
            method: request.method,
            status: request.responseStatus
        });

        await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.proxyPort, (err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Network logging proxy started on port ${this.proxyPort}`);
                    resolve();
                }
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Network logging proxy stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    setCurrentUrl(url: string) {
        this.currentUrl = url;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    getProxyPort(): number {
        return this.proxyPort;
    }

    getLogDirectory(): string {
        return this.logDir;
    }

    async getRequestsForCurrentPage(): Promise<NetworkLogIndex | null> {
        try {
            const indexFile = path.join(this.logDir, 'index.json');
            const indexContent = await fs.readFile(indexFile, 'utf-8');
            return JSON.parse(indexContent);
        } catch {
            return null;
        }
    }

    async getRequestDetails(requestFile: string): Promise<NetworkRequest | null> {
        try {
            const filePath = path.join(this.logDir, requestFile);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
}

// Global network logger instance
let networkLogger: NetworkLogger | null = null;

export const getNetworkLogger = (proxyPort?: number): NetworkLogger => {
    if (!networkLogger) {
        networkLogger = new NetworkLogger(proxyPort);
    }
    return networkLogger;
};