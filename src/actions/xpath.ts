import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { until } from 'selenium-webdriver';
import { getDriver, getLocator, buildXPathByText, buildXPathByAttribute, buildXPathForParent, buildXPathForSibling } from '../helpers.js';
import { state } from '../state.js';

export const registerXPathActions = (server: McpServer) => {
    server.tool(
        "evaluate_xpath",
        "evaluates an XPath expression and returns the result",
        {
            xpath: z.string().describe("XPath expression to evaluate"),
            resultType: z.enum(["string", "number", "boolean", "elements"]).optional().describe("Expected result type"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ xpath, resultType = "string", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const result = await driver.executeScript(`
                    var result = document.evaluate('${xpath}', document, null, XPathResult.ANY_TYPE, null);
                    switch (result.resultType) {
                        case XPathResult.STRING_TYPE:
                            return result.stringValue;
                        case XPathResult.NUMBER_TYPE:
                            return result.numberValue;
                        case XPathResult.BOOLEAN_TYPE:
                            return result.booleanValue;
                        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
                        case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
                            var elements = [];
                            var node = result.iterateNext();
                            while (node) {
                                elements.push(node.tagName || node.nodeType);
                                node = result.iterateNext();
                            }
                            return elements;
                        default:
                            return 'Unknown result type';
                    }
                `);
                
                return {
                    content: [{ type: 'text', text: `XPath result: ${JSON.stringify(result)}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error evaluating XPath: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "count_elements_by_xpath",
        "counts the number of elements matching an XPath expression",
        {
            xpath: z.string().describe("XPath expression to count"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ xpath, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const count = await driver.executeScript(`
                    return document.evaluate('count(${xpath})', document, null, XPathResult.NUMBER_TYPE, null).numberValue;
                `);
                
                return {
                    content: [{ type: 'text', text: `Found ${count} elements matching XPath: ${xpath}` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error counting elements: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "get_xpath_text_content",
        "gets the text content of all elements matching an XPath expression",
        {
            xpath: z.string().describe("XPath expression to find elements"),
            separator: z.string().optional().describe("Separator for multiple text values"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ xpath, separator = " | ", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                const texts = await driver.executeScript(`
                    var result = document.evaluate('${xpath}', document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    var texts = [];
                    var node = result.iterateNext();
                    while (node) {
                        texts.push(node.textContent || node.innerText || '');
                        node = result.iterateNext();
                    }
                    return texts;
                `);
                
                const textArray = texts as string[];
                const combinedText = textArray.join(separator);
                
                return {
                    content: [{ type: 'text', text: combinedText || 'No text content found' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting text content: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_elements_by_xpath_condition",
        "finds elements using XPath with complex conditions",
        {
            tag: z.string().describe("HTML tag to search for"),
            conditions: z.array(z.object({
                attribute: z.string().describe("Attribute name"),
                operator: z.enum(["equals", "contains", "starts-with", "ends-with", "greater-than", "less-than"]).describe("Comparison operator"),
                value: z.string().describe("Value to compare against")
            })).describe("Array of conditions to match"),
            logic: z.enum(["and", "or"]).optional().describe("Logic operator for multiple conditions"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ tag, conditions, logic = "and", timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                
                const conditionStrings = conditions.map(({ attribute, operator, value }) => {
                    switch (operator) {
                        case "contains":
                            return `contains(@${attribute}, '${value}')`;
                        case "starts-with":
                            return `starts-with(@${attribute}, '${value}')`;
                        case "ends-with":
                            return `substring(@${attribute}, string-length(@${attribute}) - string-length('${value}') + 1) = '${value}'`;
                        case "greater-than":
                            return `@${attribute} > ${value}`;
                        case "less-than":
                            return `@${attribute} < ${value}`;
                        default:
                            return `@${attribute}='${value}'`;
                    }
                });
                
                const logicOperator = logic === "and" ? " and " : " or ";
                const xpath = `//${tag}[${conditionStrings.join(logicOperator)}]`;
                
                const locator = getLocator('xpath', xpath);
                await driver.wait(until.elementLocated(locator), timeout);
                const elements = await driver.findElements(locator);
                
                return {
                    content: [{ type: 'text', text: `Found ${elements.length} elements matching complex XPath conditions` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding elements with conditions: ${e.message}` }]
                };
            }
        }
    );

    server.tool(
        "find_element_by_xpath_axes",
        "finds elements using XPath axes (ancestor, descendant, following, preceding, etc.)",
        {
            baseXpath: z.string().describe("Base XPath expression"),
            axis: z.enum(["ancestor", "ancestor-or-self", "descendant", "descendant-or-self", "following", "following-sibling", "preceding", "preceding-sibling", "parent", "child"]).describe("XPath axis to use"),
            nodeTest: z.string().optional().describe("Node test (e.g., 'div', 'span', '*')"),
            predicate: z.string().optional().describe("Additional predicate condition"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ baseXpath, axis, nodeTest = "*", predicate, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                
                let xpath = `(${baseXpath})/${axis}::${nodeTest}`;
                if (predicate) {
                    xpath += `[${predicate}]`;
                }
                
                const locator = getLocator('xpath', xpath);
                await driver.wait(until.elementLocated(locator), timeout);
                const elements = await driver.findElements(locator);
                
                return {
                    content: [{ type: 'text', text: `Found ${elements.length} elements using ${axis} axis from base XPath` }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error finding elements using axis: ${e.message}` }]
                };
            }
        }
    );
};
