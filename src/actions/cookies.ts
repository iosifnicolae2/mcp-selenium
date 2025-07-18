
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDriver } from '../helpers.js';
import { state } from '../state.js';

export const registerCookieActions = (server: McpServer) => {
    server.tool(
        "get_cookies",
        "gets all cookies",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                const cookies = await driver.manage().getCookies();
                return {
                    content: [{ type: 'text', text: JSON.stringify(cookies) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting cookies: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "add_cookie",
        "adds a cookie",
        {
            name: z.string().describe("Cookie name"),
            value: z.string().describe("Cookie value"),
            path: z.string().optional().describe("Cookie path"),
            domain: z.string().optional().describe("Cookie domain"),
            secure: z.boolean().optional().describe("Is the cookie secure"),
            httpOnly: z.boolean().optional().describe("Is the cookie HTTP only"),
            expiry: z.number().optional().describe("Cookie expiry in seconds since epoch")
        },
        async (cookie) => {
            try {
                const driver = getDriver(state);
                await driver.manage().addCookie(cookie);
                return {
                    content: [{ type: 'text', text: 'Cookie added' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error adding cookie: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "delete_cookie",
        "deletes a cookie by name",
        {
            name: z.string().describe("Name of the cookie to delete")
        },
        async ({ name }) => {
            try {
                const driver = getDriver(state);
                await driver.manage().deleteCookie(name);
                return {
                    content: [{ type: 'text', text: `Cookie ${name} deleted` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error deleting cookie: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "delete_all_cookies",
        "deletes all cookies",
        {},
        async () => {
            try {
                const driver = getDriver(state);
                await driver.manage().deleteAllCookies();
                return {
                    content: [{ type: 'text', text: 'All cookies deleted' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error deleting all cookies: ${e.message}` }]
                };
            }
        }
    );
};
