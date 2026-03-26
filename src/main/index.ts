import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { initDb } from './db'
import { registerIpcHandlers } from './ipc-handlers'
import { initScheduler } from './scheduler'

function ensureTessdata(): void {
  const destDir  = join(app.getPath('userData'), 'tessdata')
  const destFile = join(destDir, 'deu.traineddata')
  if (existsSync(destFile)) return                          // already copied

  // In production: bundled via extraResources → process.resourcesPath/tessdata/
  // In development: lives in <project-root>/resources/tessdata/
  const srcDir  = app.isPackaged
    ? join(process.resourcesPath, 'tessdata')
    : join(__dirname, '..', '..', '..', 'resources', 'tessdata')
  const srcFile = join(srcDir, 'deu.traineddata')

  if (!existsSync(srcFile)) {
    console.warn('[BriefKlar] deu.traineddata not found at', srcFile)
    return
  }

  mkdirSync(destDir, { recursive: true })
  copyFileSync(srcFile, destFile)
  console.log('[BriefKlar] tessdata copied to userData')
}

// Disable GPU acceleration — safe for machines without a dedicated GPU.
// Prevents GPU process crashes on integrated graphics / no-GPU setups.
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    // Open DevTools automatically in development
    if (process.env['ELECTRON_RENDERER_URL']) {
      mainWindow!.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.briefklar')
  }

  ensureTessdata()
  initDb()
  registerIpcHandlers(ipcMain, () => mainWindow)
  initScheduler(() => mainWindow)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
