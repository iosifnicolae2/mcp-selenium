
import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
import { z } from "zod";

export const firefoxOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run Firefox in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional Firefox arguments")
});

export type FirefoxOptionsType = z.infer<typeof firefoxOptionsSchema>;

export const startFirefox = async (options: FirefoxOptionsType = {}): Promise<WebDriver> => {
    const firefoxOptions = new FirefoxOptions();
    if (options.headless) {
        firefoxOptions.addArguments('--headless');
    }
    if (options.arguments) {
        options.arguments.forEach(arg => firefoxOptions.addArguments(arg));
    }

    const driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .setFirefoxOptions(firefoxOptions)
        .build();

    return driver;
};
