
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { until } from 'selenium-webdriver';
import { getDriver, getLocator } from '../helpers.js';
import { locatorSchema } from '../schemas.js';
import { state } from '../state.js';

export const registerElementActions = (server: McpServer) => {
    server.tool(
        "find_element",
        "finds an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                await driver.wait(until.elementLocated(locator), timeout);
                return {
                    content: [{ type: 'text', text: 'Element found' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "click_element",
        "clicks an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                await element.click();
                return {
                    content: [{ type: 'text', text: 'Element clicked' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error clicking element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "send_keys",
        "sends keys to an element, aka typing",
        {
            ...locatorSchema,
            text: z.string().describe("Text to enter into the element")
        },
        async ({ by, value, text, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                await element.clear();
                await element.sendKeys(text);
                return {
                    content: [{ type: 'text', text: `Text "${text}" entered into element` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error entering text: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_element_text",
        "gets the text() of an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const text = await element.getText();
                return {
                    content: [{ type: 'text', text }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting element text: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "upload_file",
        "uploads a file using a file input element",
        {
            ...locatorSchema,
            filePath: z.string().describe("Absolute path to the file to upload")
        },
        async ({ by, value, filePath, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                await element.sendKeys(filePath);
                return {
                    content: [{ type: 'text', text: 'File upload initiated' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error uploading file: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_elements_by_xpath",
        "finds multiple elements using XPath",
        {
            xpath: z.string().describe("XPath expression to find elements"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ xpath, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator('xpath', xpath);
                await driver.wait(until.elementLocated(locator), timeout);
                const elements = await driver.findElements(locator);
                return {
                    content: [{ type: 'text', text: `Found ${elements.length} elements matching XPath: ${xpath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding elements: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_element_attribute_by_xpath",
        "gets an attribute value from an element using XPath",
        {
            xpath: z.string().describe("XPath expression to find element"),
            attribute: z.string().describe("Name of the attribute to get"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ xpath, attribute, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator('xpath', xpath);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const value = await element.getAttribute(attribute);
                return {
                    content: [{ type: 'text', text: `${attribute}: ${value}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting attribute: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "click_element_by_xpath_text",
        "clicks an element containing specific text using XPath",
        {
            text: z.string().describe("Text content to search for"),
            tag: z.string().optional().describe("HTML tag to search within (default: any)"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ text, tag = "*", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const xpath = `//${tag}[contains(text(), '${text}')]`;
                const locator = getLocator('xpath', xpath);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                await element.click();
                return {
                    content: [{ type: 'text', text: `Clicked element containing text: "${text}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error clicking element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_element_by_xpath_attribute",
        "finds an element by XPath using attribute criteria",
        {
            tag: z.string().describe("HTML tag to search for"),
            attribute: z.string().describe("Attribute name"),
            value: z.string().describe("Attribute value"),
            operator: z.enum(["equals", "contains", "starts-with", "ends-with"]).optional().describe("Comparison operator"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ tag, attribute, value, operator = "equals", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                let xpath: string;
                
                switch (operator) {
                    case "contains":
                        xpath = `//${tag}[contains(@${attribute}, '${value}')]`;
                        break;
                    case "starts-with":
                        xpath = `//${tag}[starts-with(@${attribute}, '${value}')]`;
                        break;
                    case "ends-with":
                        xpath = `//${tag}[substring(@${attribute}, string-length(@${attribute}) - string-length('${value}') + 1) = '${value}']`;
                        break;
                    default:
                        xpath = `//${tag}[@${attribute}='${value}']`;
                }
                
                const locator = getLocator('xpath', xpath);
                await driver.wait(until.elementLocated(locator), timeout);
                return {
                    content: [{ type: 'text', text: `Found element with ${attribute} ${operator} "${value}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_parent_element",
        "finds the parent element of a given element using XPath",
        {
            childXpath: z.string().describe("XPath expression to find the child element"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ childXpath, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const parentXpath = `(${childXpath})/..`;
                const locator = getLocator('xpath', parentXpath);
                await driver.wait(until.elementLocated(locator), timeout);
                return {
                    content: [{ type: 'text', text: `Found parent element of: ${childXpath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding parent element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_sibling_element",
        "finds a sibling element using XPath",
        {
            baseXpath: z.string().describe("XPath expression to find the base element"),
            direction: z.enum(["following", "preceding"]).describe("Direction to search for sibling"),
            tag: z.string().optional().describe("HTML tag of the sibling (default: any)"),
            position: z.number().optional().describe("Position of the sibling (1-based index)"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ baseXpath, direction, tag = "*", position = 1, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const siblingXpath = `(${baseXpath})/${direction}-sibling::${tag}[${position}]`;
                const locator = getLocator('xpath', siblingXpath);
                await driver.wait(until.elementLocated(locator), timeout);
                return {
                    content: [{ type: 'text', text: `Found ${direction} sibling element at position ${position}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding sibling element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_element_by_xpath_index",
        "finds an element by XPath at a specific index",
        {
            xpath: z.string().describe("Base XPath expression"),
            index: z.number().describe("Index of the element (1-based)"),
            timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
        },
        async ({ xpath, index, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const indexedXpath = `(${xpath})[${index}]`;
                const locator = getLocator('xpath', indexedXpath);
                await driver.wait(until.elementLocated(locator), timeout);
                return {
                    content: [{ type: 'text', text: `Found element at index ${index}: ${xpath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding element at index: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_element_xpath",
        "gets the XPath of an element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                const xpath = await driver.executeScript(`
                    function getXPath(element) {
                        if (element.id !== '') {
                            return '//*[@id="' + element.id + '"]';
                        }
                        if (element === document.body) {
                            return '/html/body';
                        }
                        
                        var ix = 0;
                        var siblings = element.parentNode.childNodes;
                        for (var i = 0; i < siblings.length; i++) {
                            var sibling = siblings[i];
                            if (sibling === element) {
                                return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                            }
                            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                                ix++;
                            }
                        }
                    }
                    return getXPath(arguments[0]);
                `, element);
                
                return {
                    content: [{ type: 'text', text: `Element XPath: ${xpath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting element XPath: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_elements_xpath",
        "gets the XPath of multiple elements",
        {
            ...locatorSchema,
            includeText: z.boolean().optional().describe("Include element text in the result")
        },
        async ({ by, value, includeText = false, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                await driver.wait(until.elementLocated(locator), timeout);
                const elements = await driver.findElements(locator);
                
                const results = [];
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    const xpath = await driver.executeScript(`
                        function getXPath(element) {
                            if (element.id !== '') {
                                return '//*[@id="' + element.id + '"]';
                            }
                            if (element === document.body) {
                                return '/html/body';
                            }
                            
                            var ix = 0;
                            var siblings = element.parentNode.childNodes;
                            for (var i = 0; i < siblings.length; i++) {
                                var sibling = siblings[i];
                                if (sibling === element) {
                                    return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                                }
                                if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                                    ix++;
                                }
                            }
                        }
                        return getXPath(arguments[0]);
                    `, element);
                    
                    if (includeText) {
                        const text = await element.getText();
                        results.push(`${xpath} - Text: "${text}"`);
                    } else {
                        results.push(xpath);
                    }
                }
                
                return {
                    content: [{ type: 'text', text: `Found ${elements.length} elements:\n${results.join('\n')}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting elements XPath: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_to_element",
        "scrolls to an element on the page",
        {
            ...locatorSchema,
            behavior: z.enum(["auto", "smooth", "instant"]).optional().describe("Scroll behavior"),
            block: z.enum(["start", "center", "end", "nearest"]).optional().describe("Vertical alignment"),
            inline: z.enum(["start", "center", "end", "nearest"]).optional().describe("Horizontal alignment")
        },
        async ({ by, value, behavior = "smooth", block = "center", inline = "nearest", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    arguments[0].scrollIntoView({
                        behavior: '${behavior}',
                        block: '${block}',
                        inline: '${inline}'
                    });
                `, element);
                
                return {
                    content: [{ type: 'text', text: `Scrolled to element with ${behavior} behavior` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling to element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_element_into_view",
        "scrolls an element into view if it's not visible",
        {
            ...locatorSchema,
            alignToTop: z.boolean().optional().describe("Align element to top of viewport")
        },
        async ({ by, value, alignToTop = true, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    arguments[0].scrollIntoView(${alignToTop});
                `, element);
                
                return {
                    content: [{ type: 'text', text: `Element scrolled into view (aligned to ${alignToTop ? 'top' : 'bottom'})` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling element into view: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "highlight_element",
        "highlights an element by adding a colored border",
        {
            ...locatorSchema,
            color: z.string().optional().describe("Border color (default: red)"),
            duration: z.number().optional().describe("Duration in milliseconds to keep highlight")
        },
        async ({ by, value, color = "red", duration = 3000, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    var element = arguments[0];
                    var originalStyle = element.style.border;
                    element.style.border = '3px solid ${color}';
                    element.style.borderRadius = '3px';
                    setTimeout(function() {
                        element.style.border = originalStyle;
                    }, ${duration});
                `, element);
                
                return {
                    content: [{ type: 'text', text: `Element highlighted with ${color} border for ${duration}ms` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error highlighting element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_element_attribute",
        "gets an attribute value from an element",
        {
            ...locatorSchema,
            attribute: z.string().describe("Name of the attribute to get")
        },
        async ({ by, value, attribute, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const attributeValue = await element.getAttribute(attribute);
                return {
                    content: [{ type: 'text', text: `${attribute}: ${attributeValue}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting attribute: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_element_css_property",
        "gets a CSS property value from an element",
        {
            ...locatorSchema,
            property: z.string().describe("Name of the CSS property to get")
        },
        async ({ by, value, property, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const propertyValue = await element.getCssValue(property);
                return {
                    content: [{ type: 'text', text: `${property}: ${propertyValue}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting CSS property: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "is_element_displayed",
        "checks if an element is displayed on the page",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const isDisplayed = await element.isDisplayed();
                return {
                    content: [{ type: 'text', text: `Element is ${isDisplayed ? 'displayed' : 'not displayed'}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error checking if element is displayed: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "is_element_enabled",
        "checks if an element is enabled",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const isEnabled = await element.isEnabled();
                return {
                    content: [{ type: 'text', text: `Element is ${isEnabled ? 'enabled' : 'disabled'}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error checking if element is enabled: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "is_element_selected",
        "checks if an element is selected (for checkboxes, radio buttons, etc.)",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                const isSelected = await element.isSelected();
                return {
                    content: [{ type: 'text', text: `Element is ${isSelected ? 'selected' : 'not selected'}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error checking if element is selected: ${e.message}` }]
                };
            }
        }
    );
};
