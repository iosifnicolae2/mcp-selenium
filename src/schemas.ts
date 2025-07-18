
import { z } from "zod";

export const browserOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run browser in headless mode (not supported for Safari)"),
    arguments: z.array(z.string()).optional().describe("Additional browser arguments")
}).optional();

export const edgeOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Edge in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Edge arguments")
}).optional();

export const safariOptionsSchema = z.object({
    // Safari has very limited options compared to other browsers SMH
}).optional();

export const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "tag", "class"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};
