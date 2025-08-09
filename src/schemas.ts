
import { z } from "zod";

export const browserOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run browser in headless mode (not supported for Safari)"),
    arguments: z.array(z.string()).optional().describe("Additional browser arguments"),
    logNetworkRequests: z.boolean().optional().describe("Log all network requests to files (enabled by default for Chrome and Edge, set to false to disable)"),
    networkLogDir: z.string().optional().describe("Directory to save network logs (defaults to OS temp directory)"),
    preserveNetworkLogs: z.boolean().optional().describe("Keep network logs after browser session closes (defaults to false, logs are deleted)")
}).optional().describe("Browser options");

export const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "tag", "class"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};
