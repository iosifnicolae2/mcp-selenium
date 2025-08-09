import { NetworkLoggerCDP, getNetworkLogger } from '../src/network-logger-cdp.js';
import { WebDriver } from 'selenium-webdriver';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('selenium-webdriver');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('NetworkLoggerCDP Unit Tests', () => {
    let logger: NetworkLoggerCDP;
    let mockDriver: jest.Mocked<WebDriver>;
    let mockGet: jest.MockedFunction<any>;

    beforeEach(() => {
        logger = new NetworkLoggerCDP();
        
        // Create proper mock structure
        mockGet = jest.fn().mockResolvedValue([]);
        mockDriver = {
            manage: jest.fn().mockReturnValue({
                logs: jest.fn().mockReturnValue({
                    get: mockGet
                })
            })
        } as any;
        
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock fs operations
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);
        mockFs.readFile.mockResolvedValue('{"requests": []}');
    });

    afterEach(() => {
        if ((logger as any).captureInterval) {
            clearInterval((logger as any).captureInterval);
        }
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(logger.getLogDirectory()).toContain('mcp-selenium-network-logs');
            expect(logger.getRequests()).toEqual([]);
        });
    });

    describe('setDriver', () => {
        it('should set the WebDriver instance', () => {
            logger.setDriver(mockDriver);
            expect((logger as any).driver).toBe(mockDriver);
        });
    });

    describe('setLogDirectory', () => {
        it('should set custom log directory', () => {
            const customDir = '/custom/log/dir';
            logger.setLogDirectory(customDir);
            expect(logger.getLogDirectory()).toBe(customDir);
        });

        it('should not change directory if no parameter provided', () => {
            const originalDir = logger.getLogDirectory();
            logger.setLogDirectory();
            expect(logger.getLogDirectory()).toBe(originalDir);
        });
    });

    describe('startCapture', () => {
        it('should throw error if no driver is set', async () => {
            await expect(logger.startCapture()).rejects.toThrow('WebDriver not set');
        });

        it('should create log directory and start capturing', async () => {
            logger.setDriver(mockDriver);
            
            await logger.startCapture();
            
            expect(mockFs.mkdir).toHaveBeenCalledWith(
                logger.getLogDirectory(),
                { recursive: true }
            );
            expect((logger as any).isCapturing).toBe(true);
            expect((logger as any).captureInterval).toBeDefined();
        });
    });

    describe('stopCapture', () => {
        it('should stop capturing and clear interval', async () => {
            logger.setDriver(mockDriver);
            await logger.startCapture();
            
            await logger.stopCapture();
            
            expect((logger as any).isCapturing).toBe(false);
            expect((logger as any).captureInterval).toBeUndefined();
        });
    });

    describe('log processing', () => {
        beforeEach(() => {
            logger.setDriver(mockDriver);
        });

        it('should process Network.requestWillBeSent events', async () => {
            const mockLogs = [
                {
                    message: JSON.stringify({
                        message: {
                            method: 'Network.requestWillBeSent',
                            params: {
                                request: {
                                    url: 'https://example.com/api',
                                    method: 'GET',
                                    headers: { 'User-Agent': 'test' },
                                    postData: undefined
                                },
                                wallTime: Date.now() / 1000
                            }
                        }
                    })
                }
            ];

            mockGet.mockResolvedValue(mockLogs as any);

            await logger.startCapture();
            
            // Wait for at least one capture cycle
            await new Promise(resolve => setTimeout(resolve, 600));
            
            const requests = logger.getRequests();
            expect(requests).toHaveLength(1);
            expect(requests[0]).toMatchObject({
                url: 'https://example.com/api',
                method: 'GET',
                headers: { 'User-Agent': 'test' }
            });

            await logger.stopCapture();
        });

        it('should process Network.responseReceived events', async () => {
            // First add a request
            (logger as any).requests = [{
                url: 'https://example.com/api',
                method: 'GET',
                timestamp: new Date().toISOString()
            }];

            const mockLogs = [
                {
                    message: JSON.stringify({
                        message: {
                            method: 'Network.responseReceived',
                            params: {
                                response: {
                                    url: 'https://example.com/api',
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' },
                                    mimeType: 'application/json'
                                }
                            }
                        }
                    })
                }
            ];

            mockGet.mockResolvedValue(mockLogs as any);

            await logger.startCapture();
            
            // Wait for at least one capture cycle
            await new Promise(resolve => setTimeout(resolve, 600));

            const requests = logger.getRequests();
            expect(requests[0]).toMatchObject({
                url: 'https://example.com/api',
                method: 'GET',
                responseStatus: 200,
                responseHeaders: { 'Content-Type': 'application/json' },
                type: 'application/json'
            });

            await logger.stopCapture();
        });

        it('should handle malformed log messages gracefully', async () => {
            const mockLogs = [
                {
                    message: 'invalid json'
                },
                {
                    message: JSON.stringify({
                        message: {
                            method: 'SomeOtherEvent',
                            params: {}
                        }
                    })
                }
            ];

            mockGet.mockResolvedValue(mockLogs as any);

            await logger.startCapture();
            
            // Wait for at least one capture cycle
            await new Promise(resolve => setTimeout(resolve, 600));

            // Should not throw error and should not add any requests
            expect(logger.getRequests()).toHaveLength(0);

            await logger.stopCapture();
        });
    });

    describe('file operations', () => {
        beforeEach(() => {
            logger.setDriver(mockDriver);
        });

        it('should save requests to file', async () => {
            const mockLogs = [
                {
                    message: JSON.stringify({
                        message: {
                            method: 'Network.requestWillBeSent',
                            params: {
                                request: {
                                    url: 'https://example.com/test',
                                    method: 'POST',
                                    headers: {},
                                    postData: '{"test": "data"}'
                                },
                                wallTime: Date.now() / 1000
                            }
                        }
                    })
                }
            ];

            mockGet.mockResolvedValue(mockLogs as any);

            await logger.startCapture();
            
            // Wait for at least one capture cycle
            await new Promise(resolve => setTimeout(resolve, 600));

            expect(mockFs.writeFile).toHaveBeenCalled();
            
            // Check if the request file was written
            const writeFileCalls = mockFs.writeFile.mock.calls;
            const requestFileCall = writeFileCalls.find(call => 
                (call[0] as string).includes('request_') && 
                (call[0] as string).endsWith('.json')
            );
            
            expect(requestFileCall).toBeDefined();
            const savedData = JSON.parse(requestFileCall![1] as string);
            expect(savedData).toMatchObject({
                url: 'https://example.com/test',
                method: 'POST',
                requestBody: '{"test": "data"}'
            });

            await logger.stopCapture();
        });

        it('should update index file', async () => {
            const mockLogs = [
                {
                    message: JSON.stringify({
                        message: {
                            method: 'Network.requestWillBeSent',
                            params: {
                                request: {
                                    url: 'https://example.com/index-test',
                                    method: 'GET',
                                    headers: {}
                                },
                                wallTime: Date.now() / 1000
                            }
                        }
                    })
                }
            ];

            mockGet.mockResolvedValue(mockLogs as any);

            await logger.startCapture();
            
            // Wait for at least one capture cycle
            await new Promise(resolve => setTimeout(resolve, 600));

            // Check if the index file was written
            const writeFileCalls = mockFs.writeFile.mock.calls;
            const indexFileCall = writeFileCalls.find(call => 
                (call[0] as string).endsWith('index.json')
            );
            
            expect(indexFileCall).toBeDefined();
            const indexData = JSON.parse(indexFileCall![1] as string);
            expect(indexData.requests).toHaveLength(1);
            expect(indexData.requests[0]).toMatchObject({
                url: 'https://example.com/index-test',
                method: 'GET'
            });

            await logger.stopCapture();
        });
    });
});

describe('getNetworkLogger', () => {
    it('should return singleton instance', () => {
        const logger1 = getNetworkLogger();
        const logger2 = getNetworkLogger();
        
        expect(logger1).toBe(logger2);
        expect(logger1).toBeInstanceOf(NetworkLoggerCDP);
    });
});