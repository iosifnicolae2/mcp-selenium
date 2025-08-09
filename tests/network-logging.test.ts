import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
    registerBrowserActions,
    registerElementActions,
    registerInteractionActions,
    registerPageActions,
    registerWindowActions,
    registerCookieActions,
    registerXPathActions
} from '../src/actions/index.js';
import { state } from '../src/state.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Network Logging', () => {
    let server: McpServer;
    let startBrowserTool: any;
    let navigateTool: any;
    let getNetworkLogDirectoryTool: any;
    let getPageRequestsTool: any;
    let closeSessionTool: any;
    let errorLogs: string[] = [];

    beforeAll(async () => {
        // Capture console.error calls
        const originalError = console.error;
        console.error = jest.fn((...args) => {
            errorLogs.push(args.join(' '));
            originalError(...args);
        });

        // Initialize MCP server
        server = new McpServer({
            name: "MCP Selenium Test",
            version: "1.0.0"
        });

        // Register all action modules
        registerBrowserActions(server);
        registerElementActions(server);
        registerInteractionActions(server);
        registerPageActions(server);
        registerWindowActions(server);
        registerCookieActions(server);
        registerXPathActions(server);

        // Get tool handlers directly from server
        const tools = (server as any)._registeredTools;
        startBrowserTool = tools['start_browser'];
        navigateTool = tools['navigate'];
        getNetworkLogDirectoryTool = tools['get_network_log_directory'];
        getPageRequestsTool = tools['get_page_requests'];
        closeSessionTool = tools['close_session'];
    });

    afterAll(async () => {
        // Clean up any remaining sessions
        if (state.currentSession) {
            try {
                await closeSessionTool.callback({});
            } catch (e) {
                // Session already closed
            }
        }
    });

    test('should log network requests when navigating to google.com', async () => {
        // Clear error logs for this test
        errorLogs = [];
        // Start Chrome browser with network logging enabled
        const startResult = await startBrowserTool.callback({
            browser: 'chrome',
            options: {
                arguments: ['--headless=new'],
                logNetworkRequests: true,
                preserveNetworkLogs: true  // Keep logs for testing
            }
        });

        // Verify browser started successfully
        expect(startResult.content[0].text).toContain('Browser started with session_id');
        const sessionId = startResult.content[0].text.split('session_id: ')[1];
        expect(sessionId).toContain('chrome_');

        // Navigate to Google
        const navigateResult = await navigateTool.callback({
            url: 'https://www.google.com'
        });
        expect(navigateResult.content[0].text).toBe('Navigated to https://www.google.com');

        // Wait for network requests to be captured
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get network log directory
        const logDirResult = await getNetworkLogDirectoryTool.callback({});
        expect(logDirResult.content[0].text).toContain('Network logs directory:');
        const logDir = logDirResult.content[0].text.split('Network logs directory: ')[1];
        console.log(`\nNetwork logs directory: ${logDir}`);

        // Get page requests through MCP tool
        const pageRequestsResult = await getPageRequestsTool.callback({});
        const requestsData = JSON.parse(pageRequestsResult.content[0].text);
        
        console.log(`\nCaptured ${requestsData.totalRequests} network requests`);
        expect(requestsData.totalRequests).toBeGreaterThan(0);
        expect(requestsData.requests.some((req: any) => req.url.includes('google.com'))).toBe(true);

        // Read the index file from log directory
        const indexPath = path.join(logDir, 'index.json');
        const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
        expect(indexExists).toBe(true);

        const indexContent = await fs.readFile(indexPath, 'utf-8');
        const index = JSON.parse(indexContent);
        expect(index.requests).toBeDefined();
        expect(index.requests.length).toBeGreaterThan(0);

        // Find the first request with a response file
        const requestWithResponse = index.requests.find((req: any) => req.responseFilepath);
        
        if (requestWithResponse) {
            console.log(`\nChecking response for: ${requestWithResponse.url}`);
            console.log(`Response file: ${requestWithResponse.responseFilepath}`);
            
            // Read the response file
            const responseContent = await fs.readFile(requestWithResponse.responseFilepath, 'utf-8');
            const response = JSON.parse(responseContent);
            
            // Check response structure
            expect(response.status).toBeDefined();
            expect(response.headers).toBeDefined();
            expect(response.url).toBeDefined();
            
            // Check that response status is successful (2xx or 3xx)
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(400);
            
            // Check if responseBody exists (may not be present for all requests)
            if (response.body) {
                console.log(`Response body captured (${response.body.length} characters)`);
                expect(response.body).toBeTruthy();
                
                // For text/html responses from google.com, verify it contains expected content
                if (response.mimeType?.includes('text/html') && response.url.includes('google.com')) {
                    expect(response.body.toLowerCase()).toContain('google');
                }
            } else {
                console.log('No response body captured for this request (might be binary or redirect)');
            }
        } else {
            console.log('No requests with response files found (all might be pending or binary)');
        }
        
        // Check that at least one request from google.com has a successful response
        const googleRequests = index.requests.filter((req: any) => 
            req.url.includes('google.com') && req.status
        );
        expect(googleRequests.length).toBeGreaterThan(0);
        
        const successfulGoogleRequest = googleRequests.find((req: any) => 
            req.status >= 200 && req.status < 400
        );
        expect(successfulGoogleRequest).toBeDefined();
        console.log(`\nFound successful Google request: ${successfulGoogleRequest.url} (status: ${successfulGoogleRequest.status})`);

        // Also check if we have request files
        const requestWithFile = index.requests.find((req: any) => req.requestFilepath);
        if (requestWithFile) {
            const requestContent = await fs.readFile(requestWithFile.requestFilepath, 'utf-8');
            const request = JSON.parse(requestContent);
            
            expect(request.url).toBeDefined();
            expect(request.method).toBeDefined();
            expect(request.timestamp).toBeDefined();
            
            // Check if response data was merged into request file
            if (request.responseStatus) {
                console.log(`\nRequest ${request.url} has response status: ${request.responseStatus}`);
                if (request.responseBody) {
                    console.log(`Request file also contains response body (${request.responseBody.length} characters)`);
                }
            }
        }

        // Close the browser session
        const closeResult = await closeSessionTool.callback({});
        expect(closeResult.content[0].text).toContain(`Browser session ${sessionId} closed`);

        // Check that no errors were logged during the test
        if (errorLogs.length > 0) {
            console.log('\nErrors detected during test:');
            errorLogs.forEach(err => console.log(`  - ${err}`));
        }
        expect(errorLogs.length).toBe(0);
        
        // Verify log directory still exists (because we set preserveNetworkLogs: true)
        const dirExists = await fs.access(logDir).then(() => true).catch(() => false);
        expect(dirExists).toBe(true);
        
        // Clean up test logs manually
        await fs.rm(logDir, { recursive: true, force: true });
        console.log(`\nTest logs cleaned up: ${logDir}`);
    }, 30000);
});