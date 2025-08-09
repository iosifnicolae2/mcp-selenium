
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
                
                // Store session options
                state.sessionOptions.set(sessionId, {
                    preserveNetworkLogs: options?.preserveNetworkLogs
                });

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
                const sessionOptions = sessionId ? state.sessionOptions.get(sessionId) : undefined;
                
                if (sessionId) {
                    state.drivers.delete(sessionId);
                    state.sessionOptions.delete(sessionId);
                }
                state.currentSession = null;

                // Stop network logger and clean up logs if running (only for Chromium browsers)
                if (sessionId?.startsWith('chrome_') || sessionId?.startsWith('edge_')) {
                    try {
                        const networkLogger = getNetworkLogger();
                        // Clean up logs unless preserveNetworkLogs is true
                        const shouldCleanup = !sessionOptions?.preserveNetworkLogs;
                        await networkLogger.stopCapture(shouldCleanup);
                    } catch (loggerError) {
                        console.error('Failed to stop network logger:', loggerError);
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

    server.tool(
        "search_network_logs",
        "searches through network logs using regex patterns or plain text",
        {
            pattern: z.string().describe("Search pattern (supports regex when useRegex is true)"),
            useRegex: z.boolean().optional().default(false).describe("Whether to use regex for pattern matching"),
            searchIn: z.enum(["url", "method", "headers", "body", "all", "files"]).optional().default("all").describe("Where to search: url, method, headers, body, all, or files (searches in log files with context)"),
            includeRequests: z.boolean().optional().default(true).describe("Whether to include requests in search"),
            includeResponses: z.boolean().optional().default(true).describe("Whether to include responses in search"),
            statusFilter: z.number().optional().describe("Filter by response status code"),
            methodFilter: z.string().optional().describe("Filter by HTTP method (GET, POST, etc.)"),
            contextLines: z.number().optional().default(5).describe("Number of context lines to show around matches when searching in files")
        },
        async ({ pattern, useRegex = false, searchIn = "all", includeRequests = true, includeResponses = true, statusFilter, methodFilter, contextLines = 5 }) => {
            try {
                if (!state.currentSession?.startsWith('chrome_') && !state.currentSession?.startsWith('edge_')) {
                    return {
                        content: [{ type: 'text', text: 'Network logging is only available for Chromium-based browsers (Chrome, Edge)' }]
                    };
                }
                
                const networkLogger = getNetworkLogger();
                
                // If searching in files, use the new searchInFiles method
                if (searchIn === "files") {
                    try {
                        const fileResults = await networkLogger.searchInFiles(pattern, useRegex, contextLines);
                        
                        if (fileResults.length === 0) {
                            return {
                                content: [{ type: 'text', text: 'No matches found in network log files' }]
                            };
                        }
                        
                        // Apply filters if provided
                        const filteredResults = fileResults.filter(result => {
                            if (methodFilter && result.method !== methodFilter.toUpperCase()) {
                                return false;
                            }
                            if (statusFilter !== undefined && result.status !== statusFilter) {
                                return false;
                            }
                            return true;
                        });
                        
                        if (filteredResults.length === 0) {
                            return {
                                content: [{ type: 'text', text: 'No matches found after applying filters' }]
                            };
                        }
                        
                        return {
                            content: [{ 
                                type: 'text', 
                                text: JSON.stringify({
                                    pattern: pattern,
                                    useRegex: useRegex,
                                    searchIn: searchIn,
                                    contextLines: contextLines,
                                    totalMatches: filteredResults.length,
                                    results: filteredResults
                                }, null, 2) 
                            }]
                        };
                    } catch (e: any) {
                        return {
                            content: [{ type: 'text', text: `Error searching in files: ${e.message}` }]
                        };
                    }
                }
                
                const requests = networkLogger.getRequests();
                
                if (requests.length === 0) {
                    return {
                        content: [{ type: 'text', text: 'No network requests found' }]
                    };
                }

                // Create regex or string matcher
                let matcher: (text: string) => boolean;
                if (useRegex) {
                    try {
                        const regex = new RegExp(pattern, 'gi');
                        matcher = (text: string) => regex.test(text);
                    } catch (e) {
                        return {
                            content: [{ type: 'text', text: `Invalid regex pattern: ${e}` }]
                        };
                    }
                } else {
                    const lowerPattern = pattern.toLowerCase();
                    matcher = (text: string) => text.toLowerCase().includes(lowerPattern);
                }

                // Helper function to search in object
                const searchInObject = (obj: any): boolean => {
                    if (!obj) return false;
                    
                    if (typeof obj === 'string') {
                        return matcher(obj);
                    } else if (typeof obj === 'object') {
                        return Object.values(obj).some(value => searchInObject(value));
                    }
                    return false;
                };

                // Filter requests based on search criteria
                const matchedRequests = requests.filter(req => {
                    // Apply method filter if specified
                    if (methodFilter && req.method !== methodFilter.toUpperCase()) {
                        return false;
                    }

                    // Apply status filter if specified
                    if (statusFilter !== undefined && req.responseStatus !== statusFilter) {
                        return false;
                    }

                    // Search based on searchIn parameter
                    let matches = false;
                    
                    if (searchIn === "all") {
                        // Search in all fields
                        if (includeRequests) {
                            matches = matches || matcher(req.url) || matcher(req.method);
                            if (req.headers) matches = matches || searchInObject(req.headers);
                            if (req.requestBody) matches = matches || matcher(req.requestBody);
                        }
                        if (includeResponses) {
                            if (req.responseHeaders) matches = matches || searchInObject(req.responseHeaders);
                            if (req.responseBody) matches = matches || matcher(req.responseBody);
                        }
                    } else if (searchIn === "url") {
                        matches = matcher(req.url);
                    } else if (searchIn === "method") {
                        matches = matcher(req.method);
                    } else if (searchIn === "headers") {
                        if (includeRequests && req.headers) matches = matches || searchInObject(req.headers);
                        if (includeResponses && req.responseHeaders) matches = matches || searchInObject(req.responseHeaders);
                    } else if (searchIn === "body") {
                        if (includeRequests && req.requestBody) matches = matches || matcher(req.requestBody);
                        if (includeResponses && req.responseBody) matches = matches || matcher(req.responseBody);
                    }

                    return matches;
                });

                if (matchedRequests.length === 0) {
                    return {
                        content: [{ type: 'text', text: 'No matching network requests found' }]
                    };
                }

                // Prepare detailed results
                const results = {
                    pattern: pattern,
                    useRegex: useRegex,
                    searchIn: searchIn,
                    totalMatches: matchedRequests.length,
                    matches: matchedRequests.map(req => {
                        const result: any = {
                            timestamp: req.timestamp,
                            method: req.method,
                            url: req.url,
                            status: req.responseStatus
                        };

                        // Include matched content preview if searching in body
                        if (searchIn === "body" || searchIn === "all") {
                            const bodyMatches: string[] = [];
                            
                            if (includeRequests && req.requestBody && matcher(req.requestBody)) {
                                // Extract a snippet around the match
                                const matchIndex = req.requestBody.toLowerCase().indexOf(pattern.toLowerCase());
                                if (matchIndex !== -1) {
                                    const start = Math.max(0, matchIndex - 50);
                                    const end = Math.min(req.requestBody.length, matchIndex + pattern.length + 50);
                                    bodyMatches.push(`Request: ...${req.requestBody.substring(start, end)}...`);
                                }
                            }
                            
                            if (includeResponses && req.responseBody && matcher(req.responseBody)) {
                                // Extract a snippet around the match
                                const matchIndex = req.responseBody.toLowerCase().indexOf(pattern.toLowerCase());
                                if (matchIndex !== -1) {
                                    const start = Math.max(0, matchIndex - 50);
                                    const end = Math.min(req.responseBody.length, matchIndex + pattern.length + 50);
                                    bodyMatches.push(`Response: ...${req.responseBody.substring(start, end)}...`);
                                }
                            }
                            
                            if (bodyMatches.length > 0) {
                                result.matchedContent = bodyMatches;
                            }
                        }

                        return result;
                    })
                };

                return {
                    content: [{ 
                        type: 'text', 
                        text: JSON.stringify(results, null, 2) 
                    }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error searching network logs: ${e.message}` }]
                };
            }
        }
    );
};
