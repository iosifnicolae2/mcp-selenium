import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDriver } from '../helpers.js';
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
        "get_element_source_by_xpath",
        "gets the HTML source code of elements matching an XPath expression",
        {
            xpath: z.string().describe("XPath expression to find elements"),
            includeChildren: z.boolean().optional().describe("Whether to include child elements (default: true)"),
            timeout: z.number().optional().describe("Maximum time to wait for elements in milliseconds")
        },
        async ({ xpath, includeChildren = true, timeout = 10000 }) => {
            try {
                const driver = getDriver(state);
                
                // Use JavaScript to get the HTML content
                const htmlContent = await driver.executeScript(`
                    var result = document.evaluate('${xpath}', document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                    var htmlSources = [];
                    var node = result.iterateNext();
                    while (node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            htmlSources.push(${includeChildren} ? node.outerHTML : node.outerHTML.replace(node.innerHTML, ''));
                        }
                        node = result.iterateNext();
                    }
                    return htmlSources;
                `);
                
                const htmlArray = htmlContent as string[];
                const combinedHTML = htmlArray.join('\n\n');
                
                return {
                    content: [{ type: 'text', text: combinedHTML || 'No HTML content found' }]
                };
            } catch (e: any) {
                return {
                    content: [{ type: 'text', text: `Error getting element source: ${e.message}` }]
                };
            }
        }
    );
};
