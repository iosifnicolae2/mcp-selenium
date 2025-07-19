# MCP Selenium

This is a Model Context Protocol (MCP) server implementation for Selenium WebDriver, enabling browser automation through standardized MCP clients like Claude Code and MCP-compatible applications.

**This allows AI assistants to control web browsers programmatically.**
<br><br>
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
- Select element interaction (dropdowns)
- Table data extraction and manipulation

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
- **hover_element** - Hovers over an element
- **drag_and_drop** - Drags an element to another location
- **double_click** - Double-clicks an element
- **right_click** - Right-clicks an element (context menu)
- **send_key_combination** - Sends keyboard combinations (Ctrl+C, etc.)

### Page Actions
- **take_screenshot** - Captures a screenshot of the current page and saves it to the current directory with timestamp
- **get_page_title** - Gets the current page title
- **get_current_url** - Gets the current page URL
- **get_page_source** - Gets the complete HTML source of the page
- **refresh_page** - Refreshes the current page
- **go_back** - Navigates back in browser history
- **go_forward** - Navigates forward in browser history

### JavaScript Execution
- **execute_javascript** - Executes JavaScript code in the browser
- **execute_async_javascript** - Executes asynchronous JavaScript with callback support

### Scrolling
- **scroll_to_element** - Scrolls to bring an element into view
- **scroll_by_pixels** - Scrolls by a specified number of pixels
- **scroll_to_top** - Scrolls to the top of the page
- **scroll_to_bottom** - Scrolls to the bottom of the page

### Window Management
- **get_window_size** - Gets the current window dimensions
- **set_window_size** - Sets the window size
- **maximize_window** - Maximizes the browser window
- **get_window_handles** - Gets all open window handles
- **switch_to_window** - Switches to a specific window
- **close_window** - Closes the current window

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

## Parameters

### Browser Options
```json
{
  "headless": false,
  "arguments": ["--window-size=1920,1080", "--disable-web-security"]
}
```

### Locator Strategies
- **id** - Find by element ID
- **css** - Find by CSS selector  
- **xpath** - Find by XPath expression
- **name** - Find by name attribute
- **tag** - Find by tag name
- **class** - Find by class name

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