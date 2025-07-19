
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

    server.tool(
        "get_element_source",
        "gets the HTML source code of an element and all its child elements",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                // Get the outer HTML which includes the element itself and all children
                const outerHTML = await element.getAttribute('outerHTML');
                
                return {
                    content: [{ type: 'text', text: outerHTML || 'No HTML content found' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting element source: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "scroll_to_element",
        "scrolls to bring an element into view",
        {
            ...locatorSchema,
            behavior: z.enum(["auto", "smooth"]).optional().describe("Scroll behavior"),
            block: z.enum(["start", "center", "end", "nearest"]).optional().describe("Vertical alignment")
        },
        async ({ by, value, behavior = "auto", block = "start", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const element = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    arguments[0].scrollIntoView({
                        behavior: '${behavior}',
                        block: '${block}',
                        inline: 'nearest'
                    });
                `, element);
                
                return {
                    content: [{ type: 'text', text: 'Scrolled to element' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error scrolling to element: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "select_option_by_text",
        "selects an option in a select element by its visible text",
        {
            ...locatorSchema,
            optionText: z.string().describe("Visible text of the option to select")
        },
        async ({ by, value, optionText, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const selectElement = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    const select = arguments[0];
                    const options = select.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].text === arguments[1]) {
                            select.selectedIndex = i;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    }
                    return false;
                `, selectElement, optionText);
                
                return {
                    content: [{ type: 'text', text: `Selected option with text: "${optionText}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error selecting option: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "select_option_by_value",
        "selects an option in a select element by its value attribute",
        {
            ...locatorSchema,
            optionValue: z.string().describe("Value attribute of the option to select")
        },
        async ({ by, value, optionValue, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const selectElement = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    const select = arguments[0];
                    select.value = arguments[1];
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                `, selectElement, optionValue);
                
                return {
                    content: [{ type: 'text', text: `Selected option with value: "${optionValue}"` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error selecting option by value: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "select_option_by_index",
        "selects an option in a select element by its index",
        {
            ...locatorSchema,
            index: z.number().describe("Index of the option to select (0-based)")
        },
        async ({ by, value, index, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const selectElement = await driver.wait(until.elementLocated(locator), timeout);
                
                await driver.executeScript(`
                    const select = arguments[0];
                    const index = arguments[1];
                    if (index >= 0 && index < select.options.length) {
                        select.selectedIndex = index;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                    return false;
                `, selectElement, index);
                
                return {
                    content: [{ type: 'text', text: `Selected option at index: ${index}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error selecting option by index: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_select_options",
        "gets all available options from a select element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const selectElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const options = await driver.executeScript(`
                    const select = arguments[0];
                    const options = [];
                    for (let i = 0; i < select.options.length; i++) {
                        options.push({
                            index: i,
                            text: select.options[i].text,
                            value: select.options[i].value,
                            selected: select.options[i].selected
                        });
                    }
                    return options;
                `, selectElement);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(options, null, 2) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting select options: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_selected_option",
        "gets the currently selected option from a select element",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const selectElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const selectedOption = await driver.executeScript(`
                    const select = arguments[0];
                    const selectedIndex = select.selectedIndex;
                    if (selectedIndex >= 0) {
                        return {
                            index: selectedIndex,
                            text: select.options[selectedIndex].text,
                            value: select.options[selectedIndex].value
                        };
                    }
                    return null;
                `, selectElement);
                
                return {
                    content: [{ type: 'text', text: selectedOption ? JSON.stringify(selectedOption, null, 2) : 'No option selected' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting selected option: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_table_data",
        "extracts data from a table element",
        {
            ...locatorSchema,
            includeHeaders: z.boolean().optional().describe("Whether to include header row (default: true)")
        },
        async ({ by, value, includeHeaders = true, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const tableData = await driver.executeScript(`
                    const table = arguments[0];
                    const includeHeaders = arguments[1];
                    const data = [];
                    
                    // Get headers
                    const headers = [];
                    const headerRow = table.querySelector('thead tr, tr:first-child');
                    if (headerRow) {
                        const headerCells = headerRow.querySelectorAll('th, td');
                        headerCells.forEach(cell => headers.push(cell.textContent.trim()));
                    }
                    
                    // Get body rows
                    const rows = table.querySelectorAll('tbody tr, tr');
                    const startIndex = includeHeaders ? 0 : 1;
                    
                    for (let i = startIndex; i < rows.length; i++) {
                        const row = rows[i];
                        const cells = row.querySelectorAll('td, th');
                        const rowData = [];
                        cells.forEach(cell => rowData.push(cell.textContent.trim()));
                        if (rowData.length > 0) data.push(rowData);
                    }
                    
                    return { headers, data };
                `, tableElement, includeHeaders);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(tableData, null, 2) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error extracting table data: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_table_cell",
        "gets the content of a specific table cell by row and column",
        {
            ...locatorSchema,
            row: z.number().describe("Row index (0-based)"),
            column: z.number().describe("Column index (0-based)")
        },
        async ({ by, value, row, column, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const cellContent = await driver.executeScript(`
                    const table = arguments[0];
                    const rowIndex = arguments[1];
                    const colIndex = arguments[2];
                    
                    const rows = table.querySelectorAll('tr');
                    if (rowIndex >= 0 && rowIndex < rows.length) {
                        const cells = rows[rowIndex].querySelectorAll('td, th');
                        if (colIndex >= 0 && colIndex < cells.length) {
                            return cells[colIndex].textContent.trim();
                        }
                    }
                    return null;
                `, tableElement, row, column) as string | null;
                
                return {
                    content: [{ type: 'text', text: cellContent || `Cell at row ${row}, column ${column} not found` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting table cell: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "click_table_cell",
        "clicks on a specific table cell by row and column",
        {
            ...locatorSchema,
            row: z.number().describe("Row index (0-based)"),
            column: z.number().describe("Column index (0-based)")
        },
        async ({ by, value, row, column, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const cellClicked = await driver.executeScript(`
                    const table = arguments[0];
                    const rowIndex = arguments[1];
                    const colIndex = arguments[2];
                    
                    const rows = table.querySelectorAll('tr');
                    if (rowIndex >= 0 && rowIndex < rows.length) {
                        const cells = rows[rowIndex].querySelectorAll('td, th');
                        if (colIndex >= 0 && colIndex < cells.length) {
                            cells[colIndex].click();
                            return true;
                        }
                    }
                    return false;
                `, tableElement, row, column) as boolean;
                
                return {
                    content: [{ type: 'text', text: cellClicked ? `Clicked cell at row ${row}, column ${column}` : `Cell at row ${row}, column ${column} not found` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error clicking table cell: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_table_row_count",
        "gets the number of rows in a table",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const rowCount = await driver.executeScript(`
                    const table = arguments[0];
                    return table.querySelectorAll('tr').length;
                `, tableElement) as number;
                
                return {
                    content: [{ type: 'text', text: `Table has ${rowCount} rows` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting table row count: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_table_column_count",
        "gets the number of columns in a table",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const columnCount = await driver.executeScript(`
                    const table = arguments[0];
                    const firstRow = table.querySelector('tr');
                    return firstRow ? firstRow.querySelectorAll('td, th').length : 0;
                `, tableElement) as number;
                
                return {
                    content: [{ type: 'text', text: `Table has ${columnCount} columns` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting table column count: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_table_row_by_text",
        "finds a table row that contains specific text in any cell",
        {
            ...locatorSchema,
            searchText: z.string().describe("Text to search for in table rows"),
            columnIndex: z.number().optional().describe("Specific column to search in (optional)")
        },
        async ({ by, value, searchText, columnIndex, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const tableElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const foundRowIndex = await driver.executeScript(`
                    const table = arguments[0];
                    const searchText = arguments[1];
                    const columnIndex = arguments[2];
                    
                    const rows = table.querySelectorAll('tr');
                    for (let i = 0; i < rows.length; i++) {
                        const cells = rows[i].querySelectorAll('td, th');
                        
                        if (columnIndex !== null && columnIndex !== undefined) {
                            // Search in specific column
                            if (columnIndex >= 0 && columnIndex < cells.length) {
                                if (cells[columnIndex].textContent.includes(searchText)) {
                                    return i;
                                }
                            }
                        } else {
                            // Search in any column
                            for (let j = 0; j < cells.length; j++) {
                                if (cells[j].textContent.includes(searchText)) {
                                    return i;
                                }
                            }
                        }
                    }
                    return -1;
                `, tableElement, searchText, columnIndex) as number;
                
                return {
                    content: [{ type: 'text', text: foundRowIndex >= 0 ? `Found text "${searchText}" in row ${foundRowIndex}` : `Text "${searchText}" not found in table` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding table row: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_list_items",
        "gets all items from a list element (ul or ol)",
        {
            ...locatorSchema,
            includeIndex: z.boolean().optional().describe("Whether to include item index in the result (default: true)")
        },
        async ({ by, value, includeIndex = true, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const listItems = await driver.executeScript(`
                    const list = arguments[0];
                    const includeIndex = arguments[1];
                    const items = [];
                    const listItems = list.querySelectorAll('li');
                    
                    for (let i = 0; i < listItems.length; i++) {
                        const item = {
                            text: listItems[i].textContent.trim(),
                            innerHTML: listItems[i].innerHTML
                        };
                        
                        if (includeIndex) {
                            item.index = i;
                        }
                        
                        items.push(item);
                    }
                    
                    return {
                        type: list.tagName.toLowerCase(),
                        count: listItems.length,
                        items: items
                    };
                `, listElement, includeIndex);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(listItems, null, 2) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting list items: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_list_item",
        "gets a specific list item by index",
        {
            ...locatorSchema,
            index: z.number().describe("Index of the list item to get (0-based)")
        },
        async ({ by, value, index, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const itemContent = await driver.executeScript(`
                    const list = arguments[0];
                    const index = arguments[1];
                    const listItems = list.querySelectorAll('li');
                    
                    if (index >= 0 && index < listItems.length) {
                        return {
                            index: index,
                            text: listItems[index].textContent.trim(),
                            innerHTML: listItems[index].innerHTML,
                            attributes: Array.from(listItems[index].attributes).reduce((attrs, attr) => {
                                attrs[attr.name] = attr.value;
                                return attrs;
                            }, {})
                        };
                    }
                    return null;
                `, listElement, index);
                
                return {
                    content: [{ type: 'text', text: itemContent ? JSON.stringify(itemContent, null, 2) : `List item at index ${index} not found` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting list item: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "click_list_item",
        "clicks on a specific list item by index",
        {
            ...locatorSchema,
            index: z.number().describe("Index of the list item to click (0-based)")
        },
        async ({ by, value, index, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const itemClicked = await driver.executeScript(`
                    const list = arguments[0];
                    const index = arguments[1];
                    const listItems = list.querySelectorAll('li');
                    
                    if (index >= 0 && index < listItems.length) {
                        listItems[index].click();
                        return true;
                    }
                    return false;
                `, listElement, index) as boolean;
                
                return {
                    content: [{ type: 'text', text: itemClicked ? `Clicked list item at index ${index}` : `List item at index ${index} not found` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error clicking list item: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "click_list_item_by_text",
        "clicks on a list item that contains specific text",
        {
            ...locatorSchema,
            searchText: z.string().describe("Text to search for in list items"),
            exact: z.boolean().optional().describe("Whether to match exact text (default: false)")
        },
        async ({ by, value, searchText, exact = false, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const foundAndClicked = await driver.executeScript(`
                    const list = arguments[0];
                    const searchText = arguments[1];
                    const exact = arguments[2];
                    const listItems = list.querySelectorAll('li');
                    
                    for (let i = 0; i < listItems.length; i++) {
                        const itemText = listItems[i].textContent.trim();
                        const matches = exact ? itemText === searchText : itemText.includes(searchText);
                        
                        if (matches) {
                            listItems[i].click();
                            return { found: true, index: i, text: itemText };
                        }
                    }
                    return { found: false };
                `, listElement, searchText, exact);
                
                const result = foundAndClicked as { found: boolean; index?: number; text?: string };
                
                return {
                    content: [{ 
                        type: 'text', 
                        text: result.found 
                            ? `Clicked list item at index ${result.index} with text: "${result.text}"` 
                            : `No list item found containing text: "${searchText}"` 
                    }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error clicking list item by text: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_list_item_by_text",
        "finds the index of a list item that contains specific text",
        {
            ...locatorSchema,
            searchText: z.string().describe("Text to search for in list items"),
            exact: z.boolean().optional().describe("Whether to match exact text (default: false)")
        },
        async ({ by, value, searchText, exact = false, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const foundIndex = await driver.executeScript(`
                    const list = arguments[0];
                    const searchText = arguments[1];
                    const exact = arguments[2];
                    const listItems = list.querySelectorAll('li');
                    
                    for (let i = 0; i < listItems.length; i++) {
                        const itemText = listItems[i].textContent.trim();
                        const matches = exact ? itemText === searchText : itemText.includes(searchText);
                        
                        if (matches) {
                            return { found: true, index: i, text: itemText };
                        }
                    }
                    return { found: false, index: -1 };
                `, listElement, searchText, exact) as { found: boolean; index: number; text?: string };
                
                return {
                    content: [{ 
                        type: 'text', 
                        text: foundIndex.found 
                            ? `Found list item at index ${foundIndex.index} with text: "${foundIndex.text}"` 
                            : `No list item found containing text: "${searchText}"` 
                    }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding list item: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_list_item_count",
        "gets the number of items in a list",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const itemCount = await driver.executeScript(`
                    const list = arguments[0];
                    return {
                        count: list.querySelectorAll('li').length,
                        type: list.tagName.toLowerCase()
                    };
                `, listElement) as { count: number; type: string };
                
                return {
                    content: [{ type: 'text', text: `${itemCount.type.toUpperCase()} list has ${itemCount.count} items` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting list item count: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_nested_lists",
        "gets information about nested lists within a list",
        {
            ...locatorSchema
        },
        async ({ by, value, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const nestedInfo = await driver.executeScript(`
                    const list = arguments[0];
                    const result = {
                        hasNestedLists: false,
                        nestedLists: [],
                        totalNested: 0
                    };
                    
                    const nestedLists = list.querySelectorAll('li ul, li ol');
                    result.totalNested = nestedLists.length;
                    result.hasNestedLists = nestedLists.length > 0;
                    
                    nestedLists.forEach((nestedList, index) => {
                        const parentLi = nestedList.closest('li');
                        const parentIndex = Array.from(list.querySelectorAll('li')).indexOf(parentLi);
                        
                        result.nestedLists.push({
                            index: index,
                            type: nestedList.tagName.toLowerCase(),
                            parentItemIndex: parentIndex,
                            itemCount: nestedList.querySelectorAll('li').length,
                            parentText: parentLi ? parentLi.firstChild.textContent.trim() : ''
                        });
                    });
                    
                    return result;
                `, listElement);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(nestedInfo, null, 2) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting nested lists: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "filter_list_items",
        "filters list items based on text criteria",
        {
            ...locatorSchema,
            filter: z.string().describe("Text to filter by"),
            filterType: z.enum(["contains", "starts-with", "ends-with", "exact"]).optional().describe("Type of text filtering")
        },
        async ({ by, value, filter, filterType = "contains", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const locator = getLocator(by, value);
                const listElement = await driver.wait(until.elementLocated(locator), timeout);
                
                const filteredItems = await driver.executeScript(`
                    const list = arguments[0];
                    const filter = arguments[1];
                    const filterType = arguments[2];
                    const listItems = list.querySelectorAll('li');
                    const filtered = [];
                    
                    for (let i = 0; i < listItems.length; i++) {
                        const itemText = listItems[i].textContent.trim();
                        let matches = false;
                        
                        switch (filterType) {
                            case 'contains':
                                matches = itemText.toLowerCase().includes(filter.toLowerCase());
                                break;
                            case 'starts-with':
                                matches = itemText.toLowerCase().startsWith(filter.toLowerCase());
                                break;
                            case 'ends-with':
                                matches = itemText.toLowerCase().endsWith(filter.toLowerCase());
                                break;
                            case 'exact':
                                matches = itemText.toLowerCase() === filter.toLowerCase();
                                break;
                        }
                        
                        if (matches) {
                            filtered.push({
                                index: i,
                                text: itemText,
                                innerHTML: listItems[i].innerHTML
                            });
                        }
                    }
                    
                    return {
                        totalItems: listItems.length,
                        filteredCount: filtered.length,
                        filter: filter,
                        filterType: filterType,
                        items: filtered
                    };
                `, listElement, filter, filterType);
                
                return {
                    content: [{ type: 'text', text: JSON.stringify(filteredItems, null, 2) }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error filtering list items: ${e.message}` }]
                };
            }
        }
    );
};
