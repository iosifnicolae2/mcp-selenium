
import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { z } from "zod";
import { getNetworkLogger } from '../network-logger.js';

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

    // Configure network logging if enabled
    if (shouldLogNetwork) {
        const networkLogger = getNetworkLogger();
        
        // Start the proxy server
        await networkLogger.start();
        
        const proxyPort = networkLogger.getProxyPort();
        
        // Configure Chrome to use the proxy
        chromeOptions.addArguments(`--proxy-server=http://localhost:${proxyPort}`);
        chromeOptions.addArguments('--ignore-certificate-errors');
        chromeOptions.addArguments('--ignore-ssl-errors');
        chromeOptions.addArguments('--allow-running-insecure-content');
        chromeOptions.addArguments('--disable-web-security');
        
        console.log(`Chrome configured to use network logging proxy on port ${proxyPort}`);
        console.log(`Network logs will be saved to: ${networkLogger.getLogDirectory()}`);
    }

    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(chromeOptions)
        .build();

    return driver;
};
