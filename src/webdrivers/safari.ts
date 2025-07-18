import { Builder, WebDriver, Browser } from 'selenium-webdriver';
import { Options as SafariOptions } from 'selenium-webdriver/safari.js';
import { z } from "zod";

export const safariOptionsSchema = z.object({}).optional();

export type SafariOptionsType = z.infer<typeof safariOptionsSchema>;

export const startSafari = async (options: SafariOptionsType = {}): Promise<WebDriver> => {
    const safariOptions = new SafariOptions();

    const driver = await new Builder()
        .forBrowser(Browser.SAFARI)
        .setSafariOptions(safariOptions)
        .build();

    return driver;
};
