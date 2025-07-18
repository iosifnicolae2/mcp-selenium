
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
};
