
import { z } from "zod";

export const browserOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run browser in headless mode (not supported for Safari)"),
    arguments: z.array(z.string()).optional().describe("Additional browser arguments")
}).optional().describe("Browser options");

export const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "tag", "class"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};
