
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { until } from 'selenium-webdriver';
import { getDriver, getLocator } from '../helpers.js';
import { locatorSchema } from '../schemas.js';
import { state } from '../state.js';

export const registerInteractionActions = (server: McpServer) => {
    server.tool(
        "hover",
        "moves the mouse to hover over an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const actions = driver.actions({ bridge: true });
                await actions.move({ origin: element }).perform();
                return {
                    content: [{ type: 'text', text: 'Hovered over element' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error hovering over element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "drag_and_drop",
        "drags an element and drops it onto another element",
        {
            ...locatorSchema,
            targetBy: z.enum(["id", "css", "xpath", "name", "tag", "class"]).describe("Locator strategy to find target element"),
            targetValue: z.string().describe("Value for the target locator strategy")
        },
        async ({ by, value, targetBy, targetValue, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const sourceLocator = getLocator(by, value);
                const targetLocator = getLocator(targetBy, targetValue);
                
                const sourceElement = await driver.wait(until.elementLocated(sourceLocator), timeout);
                const targetElement = await driver.wait(until.elementLocated(targetLocator), timeout);
                
                const actions = driver.actions({ bridge: true });
                await actions.dragAndDrop(sourceElement, targetElement).perform();
                
                return {
                    content: [{ type: 'text', text: 'Drag and drop completed' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error performing drag and drop: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "double_click",
        "performs a double click on an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const actions = driver.actions({ bridge: true });
                await actions.doubleClick(element).perform();
                return {
                    content: [{ type: 'text', text: 'Double click performed' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error performing double click: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "right_click",
        "performs a right click (context click) on an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const actions = driver.actions({ bridge: true });
                await actions.contextClick(element).perform();
                return {
                    content: [{ type: 'text', text: 'Right click performed' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error performing right click: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "press_key",
        "simulates pressing a keyboard key",
        {
            key: z.string().describe("Key to press (e.g., 'Enter', 'Tab', 'a', etc.)")
        },
        async ({ key }) => {
            try {
                const driver = getDriver(state);
                const actions = driver.actions({ bridge: true });
                await actions.keyDown(key).keyUp(key).perform();
                return {
                    content: [{ type: 'text', text: `Key '${key}' pressed` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error pressing key: ${e.message}` }]
                };
            }
        }
    );
};
