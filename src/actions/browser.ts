
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WebDriver } from 'selenium-webdriver';
import { 
    startChrome, 
    startFirefox, 
    startEdge, 
    startSafari
} from '../webdrivers/index.js';
import { getDriver } from '../helpers.js';
import { state, SessionId } from '../state.js';
import { browserOptionsSchema } from '../schemas.js';
import { getNetworkLogger } from '../network-logger-cdp.js';

export const registerBrowserActions = (server: McpServer) => {
    server.tool(
        "start_browser",
        "launches browser",
        {
            browser: z.enum(["chrome", "firefox", "edge", "safari"]).describe("Browser to launch (chrome, firefox, edge, or safari)"),
            options: browserOptionsSchema
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
                
                // Update network logger with current URL (only for Chromium browsers)
                if (state.currentSession?.startsWith('chrome_') || state.currentSession?.startsWith('edge_')) {
                    const networkLogger = getNetworkLogger();
                    // CDP logger doesn't have setCurrentUrl method, no action needed
                }
                
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

                // Stop network logger if running (only for Chromium browsers)
                if (sessionId?.startsWith('chrome_') || sessionId?.startsWith('edge_')) {
                    try {
                        const networkLogger = getNetworkLogger();
                        await networkLogger.stopCapture();
                    } catch (loggerError) {
                        console.warn('Failed to stop network logger:', loggerError);
                    }
                }

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

    server.tool(
        "get_network_log_directory",
        "gets the network log directory for the current session",
        {},
        async () => {
            try {
                if (!state.currentSession?.startsWith('chrome_') && !state.currentSession?.startsWith('edge_')) {
                    return {
                        content: [{ type: 'text', text: 'Network logging is only available for Chromium-based browsers (Chrome, Edge)' }]
                    };
                }
                
                const networkLogger = getNetworkLogger();
                const logDir = networkLogger.getLogDirectory();
                return {
                    content: [{ type: 'text', text: `Network logs directory: ${logDir}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting log directory: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_page_requests",
        "gets all network requests made from the current page or a specific page URL",
        {
            pageUrl: z.string().optional().describe("Optional page URL to get requests for. If not provided, uses current page URL")
        },
        async ({ pageUrl }) => {
            try {
                if (!state.currentSession?.startsWith('chrome_') && !state.currentSession?.startsWith('edge_')) {
                    return {
                        content: [{ type: 'text', text: 'Network logging is only available for Chromium-based browsers (Chrome, Edge)' }]
                    };
                }
                
                const networkLogger = getNetworkLogger();
                const requests = networkLogger.getRequests();
                
                if (requests.length === 0) {
                    return {
                        content: [{ type: 'text', text: 'No network requests found' }]
                    };
                }

                // Filter by page URL if provided
                const filteredRequests = pageUrl ? 
                    requests.filter(req => req.url.includes(pageUrl)) : 
                    requests;

                // Return the summary
                const summary = {
                    totalRequests: filteredRequests.length,
                    pageUrl: pageUrl || 'All pages',
                    requests: filteredRequests.map(req => ({
                        timestamp: req.timestamp,
                        method: req.method,
                        url: req.url,
                        status: req.responseStatus,
                        type: req.type,
                        size: req.size
                    }))
                };

                return {
                    content: [{ 
                        type: 'text', 
                        text: JSON.stringify(summary, null, 2) 
                    }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting page requests: ${e.message}` }]
                };
            }
        }
    );
};
