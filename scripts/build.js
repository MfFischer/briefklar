#!/usr/bin/env node
// Build script — clears ELECTRON_RUN_AS_NODE before running electron-vite build
// then runs electron-builder to create the installer.

delete process.env.ELECTRON_RUN_AS_NODE
// Disable code signing — we don't have a certificate yet
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
process.env.WIN_CSC_IDENTITY_AUTO_DISCOVERY = 'false'

const { spawn } = require('child_process')
const { join }  = require('path')

const electronVite   = join(__dirname, '..', 'node_modules', '.bin', 'electron-vite')
const electronBuilder = join(__dirname, '..', 'node_modules', '.bin', 'electron-builder')

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: process.env, shell: true })
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)))
  })
}

async function main() {
  console.log('\n[1/2] Building with electron-vite...')
  await run(electronVite, ['build'])

  const target = process.argv[2] ?? '--win'
  console.log(`\n[2/2] Packaging with electron-builder (${target})...`)
  await run(electronBuilder, [target])

  console.log('\n✅ Installer created in dist/')
}

main().catch((e) => { console.error(e.message); process.exit(1) })
