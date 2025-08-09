
import { Builder, WebDriver, Browser, logging } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { z } from "zod";
import { getNetworkLogger } from '../network-logger-cdp.js';

export const chromeOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Chrome in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Chrome arguments"),
    logNetworkRequests: z.boolean().optional().describe("Log all network requests to files (enabled by default for Chrome, set to false to disable)"),
    networkLogDir: z.string().optional().describe("Directory to save network logs (defaults to OS temp directory)")
});

export type ChromeOptionsType = z.infer<typeof chromeOptionsSchema>;

export const startChrome = async (options: ChromeOptionsType = {}): Promise<WebDriver> => {
    const chromeOptions = new ChromeOptions();
    
    // Network logging is enabled by default for Chrome
    const shouldLogNetwork = options.logNetworkRequests !== false;
    
    if (options.headless) {
        chromeOptions.addArguments('--headless=new');
    }
    
    if (options.arguments) {
        options.arguments.forEach(arg => chromeOptions.addArguments(arg));
    }

    // Configure native Chrome logging for network requests
    if (shouldLogNetwork) {
        // Enable performance and network logging
        const loggingPrefs = new logging.Preferences();
        loggingPrefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);
        
        // Set Chrome-specific capabilities for network logging
        chromeOptions.setLoggingPrefs(loggingPrefs);
        // Enable network domain in DevTools
        chromeOptions.set('goog:loggingPrefs', { 'performance': 'ALL' });
        chromeOptions.set('goog:perfLoggingPrefs', {
            enableNetwork: true
        });
        
        console.log('Chrome configured with native network logging');
        if (options.networkLogDir) {
            console.log(`Network logs will be saved to: ${options.networkLogDir}`);
        }
    }

    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(chromeOptions)
        .build();

    // If network logging is enabled, set up log collection
    if (shouldLogNetwork) {
        // Enable Network domain via CDP to capture response bodies
        try {
            await (driver as any).sendAndGetDevToolsCommand('Network.enable', {
                maxTotalBufferSize: 10000000,
                maxResourceBufferSize: 5000000
            });
            console.log('CDP Network domain enabled for response body capture');
        } catch (error) {
            console.error('Failed to enable CDP Network domain:', error);
        }
        
        const networkLogger = getNetworkLogger();
        networkLogger.setDriver(driver);
        networkLogger.setLogDirectory(options.networkLogDir);
        await networkLogger.startCapture();
        console.log(`Network logging started. Logs directory: ${networkLogger.getLogDirectory()}`);
    }

    return driver;
};
