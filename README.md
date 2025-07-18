# MCP Selenium

This is a Model Context Protocol (MCP) server implementation for Selenium WebDriver, enabling browser automation through standardized MCP clients like Claude Desktop, Goose, and other MCP-compatible applications.

**This allows AI assistants to control web browsers programmatically.**
<br><br>
<img style="display: inline-block;" src="https://img.shields.io/npm/v/@sirblob/mcp-selenium"> <img style="display: inline-block;" src="https://img.shields.io/npm/dt/@sirblob/mcp-selenium" > <img style="display: inline-block;" src="https://img.shields.io/github/issues/SirBlobby/mcp-selenium" >

## Installation
Install the package using npm:
```bash
npm install @sirblob/mcp-selenium
```
Install the package using pnpm:
```bash
pnpm install @sirblob/mcp-selenium
```

## Usage
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "selenium": {
      "command": "npx",
      "args": ["-y", "@sirblob/mcp-selenium"]
    }
  }
}
```

## Supported Browsers
- Chrome
- Firefox
- Edge
- Safari

## Features
- Start browser sessions with customizable options
- Navigate to URLs
- Find elements using various locator strategies
- Click, type, and interact with elements
- Perform mouse actions (hover, drag and drop)
- Handle keyboard input
- Take screenshots
- Upload files
- Support for headless mode
- Cookie management
- Window/tab management

## Available Tools

## Start Browser
```javascript
// Start a Chrome browser
await startBrowser({ browser: "chrome", options: { headless: true } });

// Start Firefox with custom arguments
await startBrowser({ 
  browser: "firefox", 
  options: { 
    headless: false, 
    arguments: ["--width=1920", "--height=1080"] 
  } 
});
```

## Navigate
```javascript
await navigate({ url: "https://example.com" });
```

## Find Elements
```javascript
// Find by ID
await findElement({ by: "id", value: "submit-button" });

// Find by CSS selector
await findElement({ by: "css", value: ".login-form input[type='email']" });

// Find by XPath
await findElement({ by: "xpath", value: "//button[contains(text(), 'Login')]" });

// Find multiple elements by XPath
await findElementsByXpath({ xpath: "//div[@class='product-item']" });

// Find element by XPath with attribute conditions
await findElementByXpathAttribute({ 
  tag: "input", 
  attribute: "placeholder", 
  value: "Enter email", 
  operator: "contains" 
});
```

## Advanced XPath Features
```javascript
// Click element containing specific text
await clickElementByXpathText({ text: "Submit", tag: "button" });

// Find parent element
await findParentElement({ childXpath: "//input[@id='username']" });

// Find sibling elements
await findSiblingElement({ 
  baseXpath: "//label[text()='Email']", 
  direction: "following", 
  tag: "input" 
});

// Find element by index
await findElementByXpathIndex({ xpath: "//div[@class='item']", index: 3 });

// Get XPath of an element
await getElementXpath({ by: "id", value: "submit-button" });

// Get XPath of multiple elements
await getElementsXpath({ 
  by: "class", 
  value: "menu-item", 
  includeText: true 
});

// Count elements matching XPath
await countElementsByXpath({ xpath: "//tr[@class='data-row']" });

// Get text content from multiple elements
await getXpathTextContent({ 
  xpath: "//li[@class='menu-item']", 
  separator: " | " 
});

// Evaluate XPath expressions
await evaluateXpath({ 
  xpath: "count(//div[@class='product'])", 
  resultType: "number" 
});

// Find elements with complex conditions
await findElementsByXpathCondition({
  tag: "input",
  conditions: [
    { attribute: "type", operator: "equals", value: "text" },
    { attribute: "class", operator: "contains", value: "form-control" }
  ],
  logic: "and"
});

// Use XPath axes for complex navigation
await findElementByXpathAxes({
  baseXpath: "//div[@id='main']",
  axis: "descendant",
  nodeTest: "button",
  predicate: "contains(@class, 'primary')"
});
```

## Interact with Elements
```javascript
// Click an element
await clickElement({ by: "id", value: "submit-button" });

// Type text
await typeText({ by: "name", value: "username", text: "myusername" });

// Upload file
await uploadFile({ by: "id", value: "file-input", filePath: "/path/to/file.pdf" });

// Scroll to element
await scrollToElement({ 
  by: "id", 
  value: "footer", 
  behavior: "smooth", 
  block: "center" 
});

// Highlight element
await highlightElement({ 
  by: "class", 
  value: "important", 
  color: "yellow", 
  duration: 5000 
});
```

## JavaScript Injection & Scrolling
```javascript
// Execute JavaScript
await executeJavascript({ 
  script: "return document.title;" 
});

// Execute async JavaScript with callback
await executeAsyncJavascript({ 
  script: "setTimeout(arguments[arguments.length - 1], 1000);", 
  timeout: 5000 
});

// Scroll to top/bottom
await scrollToTop();
await scrollToBottom();

// Scroll by pixels
await scrollByPixels({ x: 0, y: 500 });

// Scroll to coordinates
await scrollToCoordinates({ x: 0, y: 1000 });

// Scroll element into view
await scrollElementIntoView({ 
  by: "id", 
  value: "target-element", 
  alignToTop: true 
});

// Check element state
await isElementDisplayed({ by: "id", value: "modal" });
await isElementEnabled({ by: "id", value: "submit-btn" });
await isElementSelected({ by: "id", value: "checkbox" });

// Get element properties
await getElementAttribute({ by: "id", value: "link", attribute: "href" });
await getElementCssProperty({ by: "id", value: "box", property: "background-color" });
```

## Browser Options
```typescript
interface BrowserOptions {
    headless?: boolean;        // Run browser in headless mode
    arguments?: string[];      // Additional browser arguments
}
```

## Locator Strategies
- `id` - Find by element ID
- `css` - Find by CSS selector
- `xpath` - Find by XPath expression
- `name` - Find by name attribute
- `tag` - Find by tag name
- `class` - Find by class name

## Development
```bash
# Clone the repository
git clone https://github.com/SirBlobby/mcp-selenium.git

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

#### Inspired by [@angiejones/mcp-selenium](https://github.com/angiejones/mcp-selenium)