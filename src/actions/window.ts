
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDriver } from '../helpers.js';
import { state } from '../state.js';

export const registerWindowActions = (server: McpServer) => {
    server.tool(
        "switch_to_frame",
        "switches to a frame by id or name",
        {
            id: z.union([z.string(), z.number()]).describe("ID or name of the frame")
        },
        async ({ id }) => {
            try {
                const driver = getDriver(state);
                await driver.switchTo().frame(id);
                return {
                    content: [{ type: 'text', text: `Switched to frame ${id}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error switching to frame: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "switch_to_default_content",
        "switches back to the main document",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.switchTo().defaultContent();
                return {
                    content: [{ type: 'text', text: 'Switched to default content' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error switching to default content: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "switch_to_window",
        "switches to a window by handle",
        {
            handle: z.string().describe("Window handle to switch to")
        },
        async ({ handle }) => {
            try {
                const driver = getDriver(state);
                await driver.switchTo().window(handle);
                return {
                    content: [{ type: 'text', text: `Switched to window ${handle}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error switching to window: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_window_handles",
        "gets all window handles",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const handles = await driver.getAllWindowHandles();
                return {
                    content: [{ type: 'text', text: JSON.stringify(handles) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting window handles: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "maximize_window",
        "maximizes the current window",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.manage().window().maximize();
                return {
                    content: [{ type: 'text', text: 'Window maximized' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error maximizing window: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "switch_to_window_by_title",
        "switches to a window/tab by its title",
        {
            title: z.string().describe("Title of the window/tab to switch to"),
            partial: z.boolean().optional().describe("Whether to match partial title (default: false)")
        },
        async ({ title, partial = false }) => {
            try {
                const driver = getDriver(state);
                const handles = await driver.getAllWindowHandles();
                const currentHandle = await driver.getWindowHandle();
                
                for (const handle of handles) {
                    await driver.switchTo().window(handle);
                    const windowTitle = await driver.getTitle();
                    
                    const matches = partial 
                        ? windowTitle.toLowerCase().includes(title.toLowerCase())
                        : windowTitle === title;
                    
                    if (matches) {
                        return {
                            content: [{ type: 'text', text: `Switched to window with title: "${windowTitle}"` }]
                        };
                    }
                }
                
                // If no match found, switch back to original window
                await driver.switchTo().window(currentHandle);
                return {
                    content: [{ type: 'text', text: `No window found with title: "${title}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error switching to window by title: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "switch_to_window_by_url",
        "switches to a window/tab by its URL",
        {
            url: z.string().describe("URL of the window/tab to switch to"),
            partial: z.boolean().optional().describe("Whether to match partial URL (default: false)")
        },
        async ({ url, partial = false }) => {
            try {
                const driver = getDriver(state);
                const handles = await driver.getAllWindowHandles();
                const currentHandle = await driver.getWindowHandle();
                
                for (const handle of handles) {
                    await driver.switchTo().window(handle);
                    const windowUrl = await driver.getCurrentUrl();
                    
                    const matches = partial 
                        ? windowUrl.toLowerCase().includes(url.toLowerCase())
                        : windowUrl === url;
                    
                    if (matches) {
                        return {
                            content: [{ type: 'text', text: `Switched to window with URL: "${windowUrl}"` }]
                        };
                    }
                }
                
                // If no match found, switch back to original window
                await driver.switchTo().window(currentHandle);
                return {
                    content: [{ type: 'text', text: `No window found with URL: "${url}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error switching to window by URL: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_window_size",
        "gets the current window size",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const size = await driver.manage().window().getRect();
                return {
                    content: [{ type: 'text', text: `Window size: ${size.width}x${size.height}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting window size: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "set_window_size",
        "sets the window size",
        {
            width: z.number().describe("Window width in pixels"),
            height: z.number().describe("Window height in pixels")
        },
        async ({ width, height }) => {
            try {
                const driver = getDriver(state);
                await driver.manage().window().setRect({ width, height });
                return {
                    content: [{ type: 'text', text: `Window size set to ${width}x${height}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error setting window size: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "close_window",
        "closes the current window",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.close();
                return {
                    content: [{ type: 'text', text: 'Window closed' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error closing window: ${e.message}` }]
                };
            }
        }
    );
};
