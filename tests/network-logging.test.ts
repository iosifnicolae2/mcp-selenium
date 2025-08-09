import { Builder, WebDriver, logging } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Network Logging', () => {
  let driver: WebDriver;
  let networkLogDir: string;

  beforeAll(async () => {
    // Create temp directory for network logs
    networkLogDir = path.join(os.tmpdir(), `network-logs-${Date.now()}`);
    await fs.mkdir(networkLogDir, { recursive: true });
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
    // Clean up log directory
    if (networkLogDir) {
      await fs.rm(networkLogDir, { recursive: true, force: true });
    }
  });

  test('should log network requests when navigating to google.com', async () => {
    // Set up Chrome with network logging
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--enable-logging');
    options.addArguments('--log-level=0');
    
    // Enable performance logging
    const loggingPrefs = new logging.Preferences();
    loggingPrefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);
    options.setLoggingPrefs(loggingPrefs);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Navigate to Google
    await driver.get('https://www.google.com');
    
    // Wait a bit for all requests to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get performance logs
    const logs = await driver.manage().logs().get('performance');
    
    // Parse network events
    const networkRequests: any[] = [];
    for (const entry of logs) {
      try {
        const message = JSON.parse(entry.message);
        const method = message.message?.method;
        
        if (method === 'Network.requestWillBeSent') {
          const params = message.message.params;
          networkRequests.push({
            url: params.request.url,
            method: params.request.method,
            timestamp: params.timestamp,
            type: params.type
          });
        }
      } catch (e) {
        // Skip unparseable logs
      }
    }

    // Log the requests for visibility
    console.log(`\nCaptured ${networkRequests.length} network requests:`);
    networkRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    // Assertions
    expect(networkRequests.length).toBeGreaterThan(0);
    expect(networkRequests.some(req => req.url.includes('google.com'))).toBe(true);
    
    // Save logs to file for inspection
    const logFile = path.join(networkLogDir, 'network-requests.json');
    await fs.writeFile(logFile, JSON.stringify(networkRequests, null, 2));
    console.log(`\nNetwork logs saved to: ${logFile}`);
  }, 30000); // 30 second timeout
});