
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

export const buildXPathByText = (text: string, tag: string = "*", exact: boolean = false): string => {
    return exact 
        ? `//${tag}[text()='${text}']`
        : `//${tag}[contains(text(), '${text}')]`;
};

export const buildXPathByAttribute = (
    tag: string, 
    attribute: string, 
    value: string, 
    operator: 'equals' | 'contains' | 'starts-with' | 'ends-with' = 'equals'
): string => {
    switch (operator) {
        case 'contains':
            return `//${tag}[contains(@${attribute}, '${value}')]`;
        case 'starts-with':
            return `//${tag}[starts-with(@${attribute}, '${value}')]`;
        case 'ends-with':
            return `//${tag}[substring(@${attribute}, string-length(@${attribute}) - string-length('${value}') + 1) = '${value}']`;
        default:
            return `//${tag}[@${attribute}='${value}']`;
    }
};

export const buildXPathByPosition = (baseXpath: string, position: number): string => {
    return `(${baseXpath})[${position}]`;
};

export const buildXPathForParent = (childXpath: string): string => {
    return `(${childXpath})/..`;
};

export const buildXPathForSibling = (
    baseXpath: string, 
    direction: 'following' | 'preceding', 
    tag: string = "*", 
    position: number = 1
): string => {
    return `(${baseXpath})/${direction}-sibling::${tag}[${position}]`;
};

export const buildXPathForDescendant = (
    ancestorXpath: string, 
    descendantTag: string, 
    attribute?: string, 
    value?: string
): string => {
    const base = `(${ancestorXpath})//${descendantTag}`;
    if (attribute && value) {
        return `${base}[@${attribute}='${value}']`;
    }
    return base;
};
