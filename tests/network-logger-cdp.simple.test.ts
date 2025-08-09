/**
 * Simple test to verify network logging with actual browser
 * This test requires Chrome to be installed
 */

import { startChrome } from '../src/webdrivers/chrome.js';
import { getNetworkLogger } from '../src/network-logger-cdp.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Helper function to check if Chrome is available
async function isChromeAvailable(): Promise<boolean> {
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Try to find Chrome executable
        if (process.platform === 'darwin') {
            await execAsync('ls "/Applications/Google Chrome.app" 2>/dev/null');
            return true;
        } else if (process.platform === 'win32') {
            await execAsync('where chrome 2>nul');
            return true;
        } else {
            await execAsync('which google-chrome || which chromium-browser');
            return true;
        }
    } catch {
        return false;
    }
}

describe('Network Logger CDP - Browser Test', () => {
    let chromeAvailable: boolean;

    beforeAll(async () => {
        chromeAvailable = await isChromeAvailable();
        if (!chromeAvailable) {
            console.log('Chrome browser not found. Skipping browser tests.');
        }
    });

    (chromeAvailable ? it : it.skip)('should capture and save network requests from https://example.com', async () => {
        const logDir = path.join(os.tmpdir(), `mcp-test-${Date.now()}`);
        let driver = null;

        try {
            // Start Chrome with network logging
            driver = await startChrome({
                headless: true,
                logNetworkRequests: true,
                networkLogDir: logDir
            });

            // Navigate to example.com
            await driver.get('https://example.com');
            
            // Wait for requests to be captured
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get the network logger and check requests
            const networkLogger = getNetworkLogger();
            const requests = networkLogger.getRequests();
            
            // Verify we captured requests
            expect(requests.length).toBeGreaterThan(0);
            
            // Verify main request exists
            const mainRequest = requests.find(r => 
                r.url === 'https://example.com/' && r.method === 'GET'
            );
            expect(mainRequest).toBeDefined();
            expect(mainRequest?.responseStatus).toBe(200);

            // Verify files were saved
            const files = await fs.readdir(logDir);
            expect(files).toContain('index.json');
            
            // Verify index.json content
            const indexContent = await fs.readFile(
                path.join(logDir, 'index.json'), 
                'utf-8'
            );
            const index = JSON.parse(indexContent);
            expect(index.requests).toBeDefined();
            expect(Array.isArray(index.requests)).toBe(true);
            expect(index.requests.length).toBeGreaterThan(0);

            // Verify at least one request file exists
            const requestFiles = files.filter(f => 
                f.startsWith('request_') && f.endsWith('.json')
            );
            expect(requestFiles.length).toBeGreaterThan(0);

            // Read and verify a request file
            const requestFile = requestFiles[0];
            const requestContent = await fs.readFile(
                path.join(logDir, requestFile),
                'utf-8'
            );
            const savedRequest = JSON.parse(requestContent);
            expect(savedRequest.url).toBeDefined();
            expect(savedRequest.method).toBeDefined();
            expect(savedRequest.timestamp).toBeDefined();

        } finally {
            // Cleanup
            if (driver) {
                const networkLogger = getNetworkLogger();
                await networkLogger.stopCapture();
                await driver.quit();
            }
            
            // Remove test directory
            try {
                await fs.rm(logDir, { recursive: true, force: true });
            } catch {
                // Ignore cleanup errors
            }
        }
    }, 60000); // 60 second timeout for browser test
});