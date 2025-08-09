# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Selenium is a Model Context Protocol (MCP) server implementation for Selenium WebDriver that enables browser automation through MCP-compatible clients. The project provides 80+ browser automation tools accessible through a standardized MCP interface.

## Development Commands

### Build & Run
```bash
npm run build        # Compile TypeScript to dist/
npm run dev         # Watch mode for development
npm run start       # Run the compiled server
npm run clean       # Remove dist directory
```

### Install as MCP Server
```bash
npm install @sirblob/mcp-selenium
# or
npx -y @sirblob/mcp-selenium
```

## Architecture

### Core Components

**MCP Server Layer (`src/server.ts`)**
- Main entry point that initializes the MCP server using `@modelcontextprotocol/sdk`
- Registers all action modules and handles cleanup on process termination
- Uses StdioServerTransport for client-server communication

**State Management (`src/state.ts`)**
- Maintains active WebDriver sessions in a Map structure
- Tracks the current active session for operations
- Single source of truth for browser state across all actions

**Action Modules (`src/actions/`)**
- Each module registers specific tool categories with the MCP server:
  - `browser.ts` - Browser lifecycle management (start, navigate, close)
  - `element.ts` - Element finding and basic interactions
  - `interactions.ts` - Advanced user interactions (hover, drag, keyboard)
  - `page.ts` - Page-level operations (screenshots, source, refresh)
  - `window.ts` - Window/tab management and frame switching
  - `cookies.ts` - Cookie CRUD operations
  - `xpath.ts` - XPath-specific operations and utilities

**WebDriver Implementations (`src/webdrivers/`)**
- Browser-specific configurations for Chrome, Firefox, Edge, and Safari
- Each driver module exports a start function that returns a configured WebDriver instance
- Handles browser-specific options and capabilities

**Helper Functions (`src/helpers.ts`)**
- `getDriver()` - Retrieves active driver from state with error handling
- `getLocator()` - Converts string-based locator strategies to Selenium By objects

**Schema Definitions (`src/schemas.ts`)**
- Zod schemas for input validation
- Defines browser options and locator strategies

### Tool Registration Pattern

Each action module follows a consistent pattern:
1. Import the MCP server instance
2. Define tool handlers with Zod schemas for input validation
3. Register tools using `server.tool(name, description, schema, handler)`
4. Use `getDriver()` to access the active WebDriver instance
5. Return standardized response format: `{ content: [{ type: 'text', text: result }] }`

### Session Management

- Sessions are created when a browser starts with ID format: `{browser}_{timestamp}`
- Only one session can be active at a time (tracked in `state.currentSession`)
- Sessions are cleaned up on server shutdown or explicit close

## Key Implementation Details

- All async operations use proper error handling with try-catch blocks
- WebDriver operations use configurable timeouts (default: 10000ms)
- Locator strategies support: id, css, xpath, name, tag, class
- Browser arguments can be passed for headless mode and other configurations
- The server uses ES modules (type: "module" in package.json)
- TypeScript strict mode is enabled for type safety