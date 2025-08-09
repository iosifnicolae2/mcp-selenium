import { Builder, WebDriver, Browser, logging } from 'selenium-webdriver';
import { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
import { z } from "zod";
import { getNetworkLogger } from '../network-logger-cdp.js';

export const edgeOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Edge in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Edge arguments"),
    logNetworkRequests: z.boolean().optional().describe("Log all network requests to files (enabled by default for Edge, set to false to disable)"),
    networkLogDir: z.string().optional().describe("Directory to save network logs (defaults to OS temp directory)")
});

export type EdgeOptionsType = z.infer<typeof edgeOptionsSchema>;

export const startEdge = async (options: EdgeOptionsType = {}): Promise<WebDriver> => {
    const edgeOptions = new EdgeOptions();

    // Network logging is enabled by default for Edge
    const shouldLogNetwork = options.logNetworkRequests !== false;

    if (options.headless) {
        edgeOptions.addArguments('--headless=new');
    }

    if (options.arguments) {
        options.arguments.forEach(arg => edgeOptions.addArguments(arg));
    }

    // Configure native Edge logging for network requests
    if (shouldLogNetwork) {
        // Enable performance and network logging
        const loggingPrefs = new logging.Preferences();
        loggingPrefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);

        // Set Edge-specific capabilities for network logging
        edgeOptions.setLoggingPrefs(loggingPrefs);
        // Enable network domain in DevTools
        edgeOptions.set('ms:loggingPrefs', { 'performance': 'ALL' });
        edgeOptions.set('ms:perfLoggingPrefs', {
            enableNetwork: true
        });

        console.log('Edge configured with native network logging');
        if (options.networkLogDir) {
            console.log(`Network logs will be saved to: ${options.networkLogDir}`);
        }
    }

    const driver = await new Builder()
        .forBrowser(Browser.EDGE)
        .setEdgeOptions(edgeOptions)
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
