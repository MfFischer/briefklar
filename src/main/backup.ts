import AdmZip from 'adm-zip'
import { app, dialog } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { closeDb, initDb } from './db'

export async function exportBackup(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const { filePath } = await dialog.showSaveDialog({
    title: 'BriefKlar-Backup speichern',
    defaultPath: join(app.getPath('documents'), `briefklar-backup-${today}.zip`),
    filters: [{ name: 'BriefKlar Backup', extensions: ['zip'] }]
  })
  if (!filePath) return false

  const userData = app.getPath('userData')
  const zip = new AdmZip()

  // DB
  const dbPath = join(userData, 'data', 'briefklar.db')
  if (existsSync(dbPath)) zip.addLocalFile(dbPath, 'data')

  // Scanned images
  const scansDir = join(userData, 'scans')
  if (existsSync(scansDir)) zip.addLocalFolder(scansDir, 'scans')

  zip.writeZip(filePath)
  return true
}

export async function importBackup(): Promise<boolean> {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'BriefKlar-Backup wiederherstellen',
    filters: [{ name: 'BriefKlar Backup', extensions: ['zip'] }],
    properties: ['openFile']
  })
  if (!filePaths[0]) return false

  // Close DB before overwriting the file
  closeDb()

  const zip = new AdmZip(filePaths[0])
  zip.extractAllTo(app.getPath('userData'), /* overwrite */ true)

  // Reopen DB after restore then relaunch so the renderer sees fresh data
  initDb()
  app.relaunch()
  app.exit(0)

  return true
}
