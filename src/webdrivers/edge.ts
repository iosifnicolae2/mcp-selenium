import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
import { z } from "zod";

export const edgeOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Edge in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Edge arguments")
});

export type EdgeOptionsType = z.infer<typeof edgeOptionsSchema>;

export const startEdge = async (options: EdgeOptionsType = {}): Promise<WebDriver> => {
    const edgeOptions = new EdgeOptions();
    if (options.headless) {
        edgeOptions.addArguments('--headless=new');
    }
    if (options.arguments) {
        options.arguments.forEach(arg => edgeOptions.addArguments(arg));
    }

    const driver = await new Builder()
        .forBrowser(Browser.EDGE)
        .setEdgeOptions(edgeOptions)
        .build();

    return driver;
};
