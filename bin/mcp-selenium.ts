#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn, ChildProcess } from 'child_process';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

const serverPath: string = resolve(__dirname, '../src/server.js');

// Start the server
const child: ChildProcess = spawn('node', [serverPath], {
    stdio: 'inherit'
});

child.on('error', (error: Error) => {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
    child.kill('SIGTERM');
});

process.on('SIGINT', () => {
    child.kill('SIGINT');
});