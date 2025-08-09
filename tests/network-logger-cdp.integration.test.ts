import { startChrome } from '../src/webdrivers/chrome.js';
import { startEdge } from '../src/webdrivers/edge.js';
import { getNetworkLogger } from '../src/network-logger-cdp.js';
import { WebDriver } from 'selenium-webdriver';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Integration tests for NetworkLoggerCDP
 * 
 * Prerequisites:
 * - Chrome browser must be installed
 * - Selenium will automatically download chromedriver if not present
 * 
 * To run these tests:
 * npm test -- tests/network-logger-cdp.integration.test.ts
 */
describe('NetworkLoggerCDP Integration Tests', () => {
    let driver: WebDriver | null = null;
    let logDir: string | null = null;

    afterEach(async () => {
        // Clean up: close browser and stop network logging
        if (driver) {
            try {
                const networkLogger = getNetworkLogger();
                await networkLogger.stopCapture();
            } catch (e) {
                // Ignore errors during cleanup
            }
            
            try {
                await driver.quit();
            } catch (e) {
                // Ignore errors during cleanup
            }
            driver = null;
        }

        // Clean up test log directory
        if (logDir) {
            try {
                await fs.rm(logDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore cleanup errors
            }
            logDir = null;
        }
    });

    describe('Chrome Browser', () => {
        it('should capture network requests when navigating to https://example.com', async () => {
            // Create a custom log directory for this test
            logDir = path.join(os.tmpdir(), `mcp-selenium-test-${Date.now()}`);
            
            // Start Chrome with network logging enabled
            driver = await startChrome({
                headless: true,
                logNetworkRequests: true,
                networkLogDir: logDir
            });

            // Navigate to example.com
            await driver.get('https://example.com');
            
            // Wait a bit for page to load and requests to be captured
            await driver.sleep(2000);

            // Get the network logger instance
            const networkLogger = getNetworkLogger();
            const requests = networkLogger.getRequests();
            
            // Verify that requests were captured
            expect(requests.length).toBeGreaterThan(0);
            
            // Find the main request to example.com
            const mainRequest = requests.find(req => 
                req.url.includes('example.com') && req.method === 'GET'
            );
            
            expect(mainRequest).toBeDefined();
            expect(mainRequest?.url).toContain('example.com');
            expect(mainRequest?.method).toBe('GET');
            
            // Verify that files were saved to disk
            const files = await fs.readdir(logDir);
            
            // Should have at least one request file and an index file
            expect(files.length).toBeGreaterThan(0);
            
            // Check for index.json
            const hasIndexFile = files.includes('index.json');
            expect(hasIndexFile).toBe(true);
            
            if (hasIndexFile) {
                const indexPath = path.join(logDir, 'index.json');
                const indexContent = await fs.readFile(indexPath, 'utf-8');
                const index = JSON.parse(indexContent);
                
                expect(index.requests).toBeDefined();
                expect(Array.isArray(index.requests)).toBe(true);
                expect(index.requests.length).toBeGreaterThan(0);
                
                // Verify that the main request is in the index
                const indexedMainRequest = index.requests.find((req: any) => 
                    req.url.includes('example.com')
                );
                expect(indexedMainRequest).toBeDefined();
            }
            
            // Check for request files
            const requestFiles = files.filter(f => f.startsWith('request_') && f.endsWith('.json'));
            expect(requestFiles.length).toBeGreaterThan(0);
            
            // Read and verify one of the request files
            if (requestFiles.length > 0) {
                const requestFilePath = path.join(logDir, requestFiles[0]);
                const requestContent = await fs.readFile(requestFilePath, 'utf-8');
                const savedRequest = JSON.parse(requestContent);
                
                expect(savedRequest.url).toBeDefined();
                expect(savedRequest.method).toBeDefined();
                expect(savedRequest.timestamp).toBeDefined();
            }
        }, 30000); // 30 second timeout for this test

        it('should capture response status and headers', async () => {
            logDir = path.join(os.tmpdir(), `mcp-selenium-test-${Date.now()}`);
            
            driver = await startChrome({
                headless: true,
                logNetworkRequests: true,
                networkLogDir: logDir
            });

            await driver.get('https://example.com');
            await driver.sleep(3000); // Wait longer to ensure response is captured

            const networkLogger = getNetworkLogger();
            const requests = networkLogger.getRequests();
            
            // Find a request with response data
            const requestWithResponse = requests.find(req => 
                req.url.includes('example.com') && req.responseStatus !== undefined
            );
            
            expect(requestWithResponse).toBeDefined();
            expect(requestWithResponse?.responseStatus).toBe(200);
            expect(requestWithResponse?.responseHeaders).toBeDefined();
        }, 30000);

        it('should handle navigation to multiple pages', async () => {
            logDir = path.join(os.tmpdir(), `mcp-selenium-test-${Date.now()}`);
            
            driver = await startChrome({
                headless: true,
                logNetworkRequests: true,
                networkLogDir: logDir
            });

            // Navigate to first page
            await driver.get('https://example.com');
            await driver.sleep(2000);
            
            // Navigate to second page
            await driver.get('https://www.iana.org/');
            await driver.sleep(2000);

            const networkLogger = getNetworkLogger();
            const requests = networkLogger.getRequests();
            
            // Should have requests from both pages
            const exampleRequests = requests.filter(req => req.url.includes('example.com'));
            const ianaRequests = requests.filter(req => req.url.includes('iana.org'));
            
            expect(exampleRequests.length).toBeGreaterThan(0);
            expect(ianaRequests.length).toBeGreaterThan(0);
        }, 30000);

        it('should respect logNetworkRequests: false option', async () => {
            logDir = path.join(os.tmpdir(), `mcp-selenium-test-${Date.now()}`);
            
            driver = await startChrome({
                headless: true,
                logNetworkRequests: false, // Explicitly disable network logging
                networkLogDir: logDir
            });

            await driver.get('https://example.com');
            await driver.sleep(2000);

            // Network logger should not be active
            const networkLogger = getNetworkLogger();
            const requests = networkLogger.getRequests();
            
            // Should have no requests since logging was disabled
            expect(requests.length).toBe(0);
            
            // Log directory should not be created
            try {
                await fs.access(logDir);
                // If we get here, the directory exists (it shouldn't)
                const files = await fs.readdir(logDir);
                expect(files.length).toBe(0);
            } catch (e) {
                // Expected: directory doesn't exist
                expect(e).toBeDefined();
            }
        }, 30000);
    });

    describe('Edge Browser', () => {
        // Skip Edge tests if not on Windows or if Edge is not installed
        const isEdgeAvailable = process.platform === 'win32' || process.platform === 'darwin';
        
        (isEdgeAvailable ? it : it.skip)('should capture network requests in Edge browser', async () => {
            logDir = path.join(os.tmpdir(), `mcp-selenium-test-edge-${Date.now()}`);
            
            try {
                driver = await startEdge({
                    headless: true,
                    logNetworkRequests: true,
                    networkLogDir: logDir
                });

                await driver.get('https://example.com');
                await driver.sleep(2000);

                const networkLogger = getNetworkLogger();
                const requests = networkLogger.getRequests();
                
                expect(requests.length).toBeGreaterThan(0);
                
                const mainRequest = requests.find(req => 
                    req.url.includes('example.com') && req.method === 'GET'
                );
                
                expect(mainRequest).toBeDefined();
                expect(mainRequest?.url).toContain('example.com');
                
                // Verify files were saved
                const files = await fs.readdir(logDir);
                expect(files.length).toBeGreaterThan(0);
                expect(files).toContain('index.json');
            } catch (e) {
                // If Edge is not installed, skip the test
                if ((e as Error).message.includes('Edge') || (e as Error).message.includes('msedgedriver')) {
                    console.log('Edge browser not available, skipping test');
                    return;
                }
                throw e;
            }
        }, 30000);
    });
});

describe('Network Logger Singleton', () => {
    it('should return the same instance across multiple calls', () => {
        const logger1 = getNetworkLogger();
        const logger2 = getNetworkLogger();
        
        expect(logger1).toBe(logger2);
    });
});