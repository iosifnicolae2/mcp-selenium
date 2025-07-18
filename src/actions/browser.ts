
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WebDriver } from 'selenium-webdriver';
import { 
    startChrome, 
    startFirefox, 
    startEdge, 
    startSafari, 
    chromeOptionsSchema, 
    firefoxOptionsSchema, 
    edgeOptionsSchema, 
    safariOptionsSchema 
} from '../webdrivers/index.js';
import { getDriver } from '../helpers.js';
import { state, SessionId } from '../state.js';

export const registerBrowserActions = (server: McpServer) => {
    server.tool(
        "start_browser",
        "launches browser",
        {
            browser: z.enum(["chrome", "firefox", "edge", "safari"]).describe("Browser to launch (chrome, firefox, edge, or safari)"),
            options: z.union([chromeOptionsSchema, firefoxOptionsSchema, edgeOptionsSchema, safariOptionsSchema]).optional()
        },
        async ({ browser, options = {} }: { browser: 'chrome' | 'firefox' | 'edge' | 'safari', options?: any }) => {
            try {
                let driver: WebDriver;

                switch (browser) {
                    case 'chrome':
                        driver = await startChrome(options);
                        break;
                    case 'firefox':
                        driver = await startFirefox(options);
                        break;
                    case 'edge':
                        driver = await startEdge(options);
                        break;
                    case 'safari':  
                        driver = await startSafari(options);
                        break;
                    default:
                        throw new Error(`Unsupported browser: ${browser}`);
                }

                
                const sessionId: SessionId = `${browser}_${Date.now()}`;
                state.drivers.set(sessionId, driver);
                state.currentSession = sessionId;

                return {
                    content: [{ type: 'text', text: `Browser started with session_id: ${sessionId}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error starting browser: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "navigate",
        "navigates to a URL",
        {
            url: z.string().describe("URL to navigate to")
        },
        async ({ url }) => {
            try {
                const driver = getDriver(state);
                await driver.get(url);
                return {
                    content: [{ type: 'text', text: `Navigated to ${url}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error navigating: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "close_session",
        "closes the current browser session",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.quit();
                const sessionId = state.currentSession;
                if (sessionId) {
                    state.drivers.delete(sessionId);
                }
                state.currentSession = null;
                return {
                    content: [{ type: 'text', text: `Browser session ${sessionId} closed` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error closing session: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_browser_status",
        "gets the status of the current browser session",
        {},
        async () => {
            return {
                content: [{
                    type: 'text',
                    text: state.currentSession
                        ? `Active browser session: ${state.currentSession}`
                        : "No active browser session"
                }]
            };
        }
    );
};
