
import { By, Locator } from 'selenium-webdriver';
import { ServerState } from './state.js';

export const getDriver = (state: ServerState) => {
    if (!state.currentSession) {
        throw new Error('No active browser session');
    }
    const driver = state.drivers.get(state.currentSession);
    if (!driver) {
        throw new Error('No active browser session');
    }
    return driver;
};

export const getLocator = (by: string, value: string): Locator => {
    switch (by.toLowerCase()) {
        case 'id': return By.id(value);
        case 'css': return By.css(value);
        case 'xpath': return By.xpath(value);
        case 'name': return By.name(value);
        case 'tag': return By.css(value);
        case 'class': return By.className(value);
        default: throw new Error(`Unsupported locator strategy: ${by}`);
    }
};
