#!/usr/bin/env node
// Launcher that removes ELECTRON_RUN_AS_NODE before starting electron-vite.
// Needed because Ollama sets ELECTRON_RUN_AS_NODE=1 globally on this machine,
// which makes Electron run as plain Node.js and crashes the app on startup.

delete process.env.ELECTRON_RUN_AS_NODE

const { spawn } = require('child_process')
const { join } = require('path')

// Use local binary directly so it works regardless of global PATH
const electronVite = join(__dirname, '..', 'node_modules', '.bin', 'electron-vite')

const child = spawn(electronVite, ['dev'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
})

child.on('exit', (code) => process.exit(code ?? 0))
