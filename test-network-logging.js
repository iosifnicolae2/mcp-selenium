#!/usr/bin/env node

/**
 * Manual test script for network logging functionality
 * 
 * This script demonstrates how network logging works with Chrome and Edge browsers.
 * It launches a browser, navigates to example.com, and saves all network requests.
 * 
 * Usage:
 * 1. First build the project: npm run build
 * 2. Then run this test: node test-network-logging.js
 * 
 * Prerequisites:
 * - Chrome or Edge browser must be installed
 * - The project must be built (npm run build)
 */

import { startChrome } from './dist/src/webdrivers/chrome.js';
import { getNetworkLogger } from './dist/src/network-logger-cdp.js';
import fs from 'fs/promises';
import path from 'path';

async function testNetworkLogging() {
    console.log('Starting network logging test...\n');
    
    let driver = null;
    
    try {
        // Start Chrome with network logging enabled
        console.log('1. Starting Chrome browser with network logging enabled...');
        driver = await startChrome({
            headless: false,  // Run with GUI so you can see what's happening
            logNetworkRequests: true  // Enable network logging
        });
        
        // Get the network logger instance
        const networkLogger = getNetworkLogger();
        const logDir = networkLogger.getLogDirectory();
        console.log(`   Network logs will be saved to: ${logDir}\n`);
        
        // Navigate to example.com
        console.log('2. Navigating to https://example.com...');
        await driver.get('https://example.com');
        
        // Wait for page to load and requests to be captured
        console.log('   Waiting for page to load...');
        await driver.sleep(3000);
        
        // Navigate to another page to generate more requests
        console.log('\n3. Navigating to https://www.iana.org/domains/reserved...');
        await driver.get('https://www.iana.org/domains/reserved');
        await driver.sleep(3000);
        
        // Get captured requests
        const requests = networkLogger.getRequests();
        console.log(`\n4. Captured ${requests.length} network requests:`);
        console.log('=' .repeat(60));
        
        // Display first 10 requests
        requests.slice(0, 10).forEach((req, index) => {
            console.log(`   ${index + 1}. [${req.method}] ${req.url}`);
            if (req.responseStatus) {
                console.log(`      Status: ${req.responseStatus}, Type: ${req.type || 'unknown'}`);
            }
        });
        
        if (requests.length > 10) {
            console.log(`   ... and ${requests.length - 10} more requests`);
        }
        
        // Check saved files
        console.log('\n5. Checking saved files...');
        const files = await fs.readdir(logDir);
        console.log(`   Found ${files.length} files in log directory:`);
        
        const indexFile = files.find(f => f === 'index.json');
        const requestFiles = files.filter(f => f.startsWith('request_'));
        
        console.log(`   - index.json: ${indexFile ? 'Yes' : 'No'}`);
        console.log(`   - Request files: ${requestFiles.length}`);
        
        // Read and display index file
        if (indexFile) {
            const indexPath = path.join(logDir, 'index.json');
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            const index = JSON.parse(indexContent);
            
            console.log(`\n6. Index file contains ${index.requests.length} request summaries`);
            
            // Show summary by domain
            const domains = {};
            index.requests.forEach(req => {
                try {
                    const url = new URL(req.url);
                    const domain = url.hostname;
                    domains[domain] = (domains[domain] || 0) + 1;
                } catch (e) {
                    // Invalid URL
                }
            });
            
            console.log('\n   Requests by domain:');
            Object.entries(domains).forEach(([domain, count]) => {
                console.log(`   - ${domain}: ${count} requests`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('Test completed successfully!');
        console.log(`All network logs saved to: ${logDir}`);
        console.log('\nYou can inspect the JSON files to see detailed request/response data.');
        
        // Keep browser open for 5 seconds so user can see it
        console.log('\nBrowser will close in 5 seconds...');
        await driver.sleep(5000);
        
    } catch (error) {
        console.error('\nError during test:', error.message);
        
        if (error.message.includes('Chrome') || error.message.includes('chromedriver')) {
            console.error('\nMake sure Chrome browser is installed and chromedriver is available.');
            console.error('Selenium should automatically download chromedriver on first run.');
        }
    } finally {
        // Clean up
        if (driver) {
            try {
                const networkLogger = getNetworkLogger();
                await networkLogger.stopCapture();
                await driver.quit();
                console.log('\nBrowser closed and network logging stopped.');
            } catch (e) {
                console.error('Error during cleanup:', e.message);
            }
        }
    }
}

// Run the test
console.log('Network Logging Test for MCP Selenium');
console.log('======================================\n');

testNetworkLogging().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});