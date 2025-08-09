# MCP Selenium

A comprehensive Model Context Protocol (MCP) server implementation for Selenium WebDriver, enabling advanced browser automation through standardized MCP clients like Claude Desktop and other MCP-compatible applications.

**This allows AI assistants to control web browsers programmatically with 80+ automation tools.**

<img style="display: inline-block;" src="https://img.shields.io/npm/v/@sirblob/mcp-selenium">
<img style="display: inline-block;" src="https://img.shields.io/npm/dt/@sirblob/mcp-selenium" >
<img style="display: inline-block;" src="https://img.shields.io/github/issues/SirBlobby/mcp-selenium" >

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
- **Chrome** - Full feature support including headless mode and network logging
- **Firefox** - Full feature support including headless mode (network logging not supported)
- **Edge** - Full feature support including headless mode and network logging
- **Safari** - Basic feature support (limited options, network logging not supported)

### Network Request Logging
Network request logging is available **only for Chromium-based browsers** (Chrome and Edge). This feature automatically captures all HTTP/HTTPS requests made by the page and saves them to log files for analysis.

**Supported browsers for network logging:**
- ✅ **Chrome** - Full network logging support via Chrome DevTools Protocol
- ✅ **Edge** - Full network logging support via Chrome DevTools Protocol  
- ❌ **Firefox** - Network logging not supported
- ❌ **Safari** - Network logging not supported

**Network Logging Tools:**
- `get_network_log_directory` - Gets the directory where network logs are saved
- `get_page_requests` - Gets all network requests captured for the current page

## Available Tools

### Browser Management
- **start_browser** - Launches a browser (Chrome, Firefox, Edge, or Safari) with optional configuration
- **navigate** - Navigates to a specified URL
- **close_session** - Closes the current browser session
- **get_browser_status** - Gets the status of the current browser session

### Element Finding and Interaction
- **find_element** - Finds an element using various locator strategies
- **click_element** - Clicks on an element
- **send_keys** - Sends text input to an element (typing)
- **get_element_text** - Gets the text content of an element
- **get_element_source** - Gets the HTML source code of an element and all its child elements
- **upload_file** - Uploads a file using a file input element
- **find_elements_by_xpath** - Finds multiple elements using XPath
- **scroll_to_element** - Scrolls to bring an element into view
- **highlight_element** - Highlights an element with a colored border for debugging
- **find_parent_element** - Finds the parent element of a given element
- **find_sibling_element** - Finds sibling elements of a given element

### Select Element Tools
- **select_option_by_text** - Selects an option in a select element by its visible text
- **select_option_by_value** - Selects an option in a select element by its value attribute
- **select_option_by_index** - Selects an option in a select element by its index
- **get_select_options** - Gets all available options from a select element
- **get_selected_option** - Gets the currently selected option from a select element

### Table Element Tools
- **get_table_data** - Extracts all data from a table element
- **get_table_cell** - Gets the content of a specific table cell by row and column
- **click_table_cell** - Clicks on a specific table cell by row and column
- **get_table_row_count** - Gets the number of rows in a table
- **get_table_column_count** - Gets the number of columns in a table
- **find_table_row_by_text** - Finds a table row that contains specific text

### List Element Tools
- **get_list_items** - Gets all items from a list element (ul or ol)
- **get_list_item** - Gets a specific list item by index
- **click_list_item** - Clicks on a specific list item by index
- **click_list_item_by_text** - Clicks on a list item that contains specific text
- **find_list_item_by_text** - Finds the index of a list item that contains specific text
- **get_list_item_count** - Gets the number of items in a list
- **get_nested_lists** - Gets information about nested lists within a list
- **filter_list_items** - Filters list items based on text criteria

### Element State and Properties
- **get_element_attribute** - Gets an attribute value from an element
- **get_element_css_property** - Gets a CSS property value from an element
- **is_element_displayed** - Checks if an element is visible
- **is_element_enabled** - Checks if an element is enabled/interactive
- **is_element_selected** - Checks if an element is selected (for checkboxes, radio buttons)

### Mouse and Keyboard Interactions
- **hover** - Moves the mouse to hover over an element
- **hover_element** - Alternative hover command for element interaction
- **drag_and_drop** - Drags an element to another location
- **double_click** - Double-clicks an element
- **right_click** - Right-clicks an element (context menu)
- **send_key_combination** - Sends keyboard combinations (Ctrl+C, Alt+Tab, etc.)
- **press_key** - Simulates pressing a single keyboard key

### Page Actions
- **take_screenshot** - Captures a screenshot of the current page and saves it to the current directory with timestamp
- **get_page_title** - Gets the current page title
- **get_title** - Alternative method to get the current page title
- **get_current_url** - Gets the current page URL
- **get_page_source** - Gets the complete HTML source of the page
- **page_source** - Alternative method to get the complete HTML source of the page
- **refresh_page** - Refreshes the current page
- **go_back** - Navigates back in browser history
- **go_forward** - Navigates forward in browser history

### JavaScript Execution
- **execute_javascript** - Executes JavaScript code in the browser
- **execute_async_javascript** - Executes asynchronous JavaScript with callback support

### Scrolling
- **scroll_to_element** - Scrolls to bring an element into view
- **scroll_element_into_view** - Alternative method to scroll an element into view
- **scroll_by_pixels** - Scrolls by a specified number of pixels
- **scroll_to_coordinates** - Scrolls to specific coordinates on the page
- **scroll_to_top** - Scrolls to the top of the page
- **scroll_to_bottom** - Scrolls to the bottom of the page

### Window Management
- **get_window_size** - Gets the current window dimensions
- **set_window_size** - Sets the window size
- **maximize_window** - Maximizes the browser window
- **get_window_handles** - Gets all open window handles
- **switch_to_window** - Switches to a specific window by handle
- **switch_to_window_by_title** - Switches to a window/tab by its title
- **switch_to_window_by_url** - Switches to a window/tab by its URL
- **close_window** - Closes the current window
- **switch_to_frame** - Switches to a frame by ID or name
- **switch_to_default_content** - Switches back to the main document

### Cookie Management
- **get_cookies** - Gets all cookies for the current domain
- **add_cookie** - Adds a new cookie
- **delete_cookie** - Deletes a specific cookie
- **delete_all_cookies** - Deletes all cookies

### XPath Tools
- **evaluate_xpath** - Evaluates an XPath expression and returns the result
- **count_elements_by_xpath** - Counts elements matching an XPath expression
- **get_xpath_text_content** - Gets text content from elements matching XPath
- **get_element_source_by_xpath** - Gets HTML source of elements matching XPath
- **get_element_xpath** - Gets the XPath of an element
- **get_elements_xpath** - Gets XPath expressions for multiple elements
- **get_element_attribute_by_xpath** - Gets an attribute value from an element using XPath
- **find_element_by_xpath_attribute** - Finds elements by XPath and attribute values
- **find_element_by_xpath_index** - Finds an element by XPath at a specific index
- **click_element_by_xpath_text** - Clicks an element found by XPath containing specific text

## Advanced Element Operations

### Element State and Properties
- **get_element_attribute** - Gets an attribute value from an element
- **get_element_css_property** - Gets a CSS property value from an element
- **is_element_displayed** - Checks if an element is visible
- **is_element_enabled** - Checks if an element is enabled/interactive
- **is_element_selected** - Checks if an element is selected (for checkboxes, radio buttons)

## Configuration Parameters

### Browser Options
Configure browser behavior with optional parameters:
```json
{
  "headless": false,
  "arguments": ["--window-size=1920,1080", "--disable-web-security", "--disable-dev-shm-usage"],
  "logNetworkRequests": true,
  "networkLogDir": "/custom/path/to/logs"
}
```

**Network Logging Options (Chrome/Edge only):**
- `logNetworkRequests` - Enable/disable network request logging (default: `true` for Chrome/Edge)
- `networkLogDir` - Custom directory for network logs (default: OS temp directory)

**Common Browser Arguments:**
- `--headless=new` - Run in headless mode (Chrome/Edge)
- `--window-size=width,height` - Set initial window size
- `--disable-web-security` - Disable CORS restrictions
- `--disable-dev-shm-usage` - Overcome limited resource problems
- `--no-sandbox` - Disable sandbox (useful in containerized environments)
- `--disable-gpu` - Disable GPU hardware acceleration

### Locator Strategies
Multiple ways to find elements on the page:
- **id** - Find by element ID (`<div id="myElement">`)
- **css** - Find by CSS selector (`div.class-name`, `#id-name`)
- **xpath** - Find by XPath expression (`//div[@class='example']`)
- **name** - Find by name attribute (`<input name="username">`)
- **tag** - Find by HTML tag name (`div`, `span`, `input`)
- **class** - Find by class name (`class-name`)

### Timeout Configuration
Most tools accept an optional `timeout` parameter (default: 10000ms):
```json
{
  "by": "id",
  "value": "submit-button",
  "timeout": 15000
}
```

### Requirements
- **Node.js** 22+ 
- **npm** or **pnpm**
- **Browser drivers** (automatically managed by Selenium)
- **TypeScript** 5.0+ (dev dependency)

## Testing

Run all tests:
```bash
npm test
```

Run specific test:
```bash
npm test -- tests/network-logging.test.ts
```

The test suite includes:
- **Network Logging Test**: Launches Chrome, navigates to google.com, and captures all network requests via Chrome DevTools Protocol

## Troubleshooting

### Common Issues
- **Driver not found**: Selenium automatically downloads drivers, but ensure you have the target browser installed
- **Permission errors**: On Linux, you may need to install browser packages (`chromium-browser`, `firefox`, etc.)
- **Timeout errors**: Increase timeout values for slow-loading pages
- **Headless mode issues**: Some features may not work in headless mode (file uploads, certain interactions)

### Platform-Specific Notes
- **macOS**: Safari requires enabling automation in Safari preferences
- **Linux**: May require additional dependencies for GUI browsers
- **Windows**: Should work out of the box with standard browser installations

## License
MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgements
Inspired by [@angiejones/mcp-selenium](https://github.com/angiejones/mcp-selenium)
