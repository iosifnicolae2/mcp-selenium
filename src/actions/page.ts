
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDriver } from '../helpers.js';
import { state } from '../state.js';

export const registerPageActions = (server: McpServer) => {
    server.tool(
        "take_screenshot",
        "captures a screenshot of the current page",
        {
            outputPath: z.string().optional().describe("Optional path where to save the screenshot. If not provided, saves to current directory with timestamp.")
        },
        async ({ outputPath }) => {
            try {
                const driver = getDriver(state);
                const screenshot = await driver.takeScreenshot();
                
                // If no outputPath provided, save to current directory with timestamp
                if (!outputPath) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    outputPath = `screenshot-${timestamp}.png`;
                }
                
                const fs = await import('fs');
                const path = await import('path');
                
                // Resolve the path relative to current working directory
                const fullPath = path.resolve(process.cwd(), outputPath);
                
                await fs.promises.writeFile(fullPath, screenshot, 'base64');
                return {
                    content: [{ type: 'text', text: `Screenshot saved to ${fullPath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error taking screenshot: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_current_url",
        "gets the current URL of the browser",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const url = await driver.getCurrentUrl();
                return {
                    content: [{ type: 'text', text: url }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting current URL: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_title",
        "gets the title of the current page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const title = await driver.getTitle();
                return {
                    content: [{ type: 'text', text: title }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting title: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "page_source",
        "gets the source code of the current page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const source = await driver.getPageSource();
                return {
                    content: [{ type: 'text', text: source }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting page source: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "execute_javascript",
        "executes JavaScript code in the browser",
        {
            script: z.string().describe("JavaScript code to execute"),
            args: z.array(z.any()).optional().describe("Arguments to pass to the script")
        },
        async ({ script, args = [] }) => {
            try {
                const driver = getDriver(state);
                const result = await driver.executeScript(script, ...args);
                return {
                    content: [{ type: 'text', text: `JavaScript executed successfully. Result: ${JSON.stringify(result)}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error executing JavaScript: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "execute_async_javascript",
        "executes asynchronous JavaScript code in the browser",
        {
            script: z.string().describe("Asynchronous JavaScript code to execute (must call callback)"),
            args: z.array(z.any()).optional().describe("Arguments to pass to the script"),
            timeout: z.number().optional().describe("Timeout in milliseconds")
        },
        async ({ script, args = [], timeout = 30000 }) => {
            try {
                const driver = getDriver(state);
                await driver.manage().setTimeouts({ script: timeout });
                const result = await driver.executeAsyncScript(script, ...args);
                return {
                    content: [{ type: 'text', text: `Async JavaScript executed successfully. Result: ${JSON.stringify(result)}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error executing async JavaScript: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_to_top",
        "scrolls to the top of the page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.executeScript("window.scrollTo(0, 0);");
                return {
                    content: [{ type: 'text', text: 'Scrolled to top of page' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling to top: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_to_bottom",
        "scrolls to the bottom of the page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
                return {
                    content: [{ type: 'text', text: 'Scrolled to bottom of page' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling to bottom: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_by_pixels",
        "scrolls by a specified number of pixels",
        {
            x: z.number().describe("Horizontal pixels to scroll"),
            y: z.number().describe("Vertical pixels to scroll")
        },
        async ({ x, y }) => {
            try {
                const driver = getDriver(state);
                await driver.executeScript(`window.scrollBy(${x}, ${y});`);
                return {
                    content: [{ type: 'text', text: `Scrolled by ${x}px horizontally and ${y}px vertically` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling by pixels: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_to_coordinates",
        "scrolls to specific coordinates on the page",
        {
            x: z.number().describe("X coordinate to scroll to"),
            y: z.number().describe("Y coordinate to scroll to")
        },
        async ({ x, y }) => {
            try {
                const driver = getDriver(state);
                await driver.executeScript(`window.scrollTo(${x}, ${y});`);
                return {
                    content: [{ type: 'text', text: `Scrolled to coordinates (${x}, ${y})` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling to coordinates: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "go_back",
        "navigates back in browser history",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.navigate().back();
                return {
                    content: [{ type: 'text', text: 'Navigated back in history' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error navigating back: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "go_forward",
        "navigates forward in browser history",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.navigate().forward();
                return {
                    content: [{ type: 'text', text: 'Navigated forward in history' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error navigating forward: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "refresh_page",
        "refreshes the current page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.navigate().refresh();
                return {
                    content: [{ type: 'text', text: 'Page refreshed' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error refreshing page: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_page_title",
        "gets the current page title",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const title = await driver.getTitle();
                return {
                    content: [{ type: 'text', text: title }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting page title: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_page_source",
        "gets the complete HTML source of the page",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const source = await driver.getPageSource();
                return {
                    content: [{ type: 'text', text: source }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting page source: ${e.message}` }]
                };
            }
        }
    );
};
