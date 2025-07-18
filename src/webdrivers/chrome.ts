
import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { z } from "zod";

export const chromeOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Chrome in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Chrome arguments")
}).optional();

export type ChromeOptionsType = z.infer<typeof chromeOptionsSchema>;

export const startChrome = async (options: ChromeOptionsType = {}): Promise<WebDriver> => {
    const chromeOptions = new ChromeOptions();
    if (options.headless) {
        chromeOptions.addArguments('--headless=new');
    }
    if (options.arguments) {
        options.arguments.forEach(arg => chromeOptions.addArguments(arg));
    }

    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(chromeOptions)
        .build();

    return driver;
};
