import { IpcMain, BrowserWindow, dialog, shell } from 'electron'
import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { startHandoffServer, stopHandoffServer, startCalendarServer, stopCalendarServer, generateIcs } from './handoff-server'
import { processImage } from './image-processor'
import { runOcr } from './ocr'
import { analyzeText, getAllLetterTypes, getLetterTypeInfo } from './pattern-matcher'
import {
  dbSaveLetter, dbGetLetters, dbGetLetter,
  dbUpdateLetter, dbDeleteLetter,
  dbSaveReply, dbGetReplies,
  dbGetSetting, dbSetSetting
} from './db'
import { dbSaveFeedback, dbGetFeedbackStats, dbExportFeedback } from './feedback'
import { scheduleReminder, cancelReminder } from './scheduler'
import { exportReplyToPdf, exportAnalysisToPdf } from './pdf-generator'
import { exportBackup, importBackup } from './backup'
import { generateAiReply, testApiKey } from './ai-reply'
import type { NewLetter, NewReply, Feedback } from '../shared/types'

export function registerIpcHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
): void {

  // ── Handoff server ──────────────────────────────────────────────────────────

  ipcMain.handle('start-handoff-server', async () => {
    const info = await startHandoffServer((imagePath) => {
      getWindow()?.webContents.send('photo-received', imagePath)
    })
    return info
  })

  ipcMain.handle('stop-handoff-server', async () => {
    await stopHandoffServer()
  })

  // ── Image + OCR pipeline ────────────────────────────────────────────────────

  ipcMain.handle('process-image', async (_event, imagePath: string) => {
    return processImage(imagePath)
  })

  ipcMain.handle('run-ocr', async (_event, imagePath: string) => {
    return runOcr(imagePath)
  })

  ipcMain.handle('analyze-text', async (_event, rawText: string) => {
    return analyzeText(rawText)
  })

  // Full pipeline: process + OCR + analyze in one call
  ipcMain.handle('process-letter', async (_event, imagePath: string) => {
    let processed
    try {
      processed = await processImage(imagePath)
    } catch (e: any) {
      throw new Error(`Image processing failed: ${e.message ?? e}`)
    }

    let rawText = ''
    try {
      rawText = await runOcr(processed.processedPath)
    } catch (e: any) {
      throw new Error(`OCR failed: ${e.message ?? e}`)
    }

    if (!rawText || rawText.trim().length < 20) {
      throw new Error('OCR returned no readable text. Please try again with a clearer, well-lit photo.')
    }

    const analysis = analyzeText(rawText)
    return { processed, rawText, analysis }
  })

  // ── Knowledge base ──────────────────────────────────────────────────────────

  ipcMain.handle('get-letter-types', async () => {
    return getAllLetterTypes()
  })

  ipcMain.handle('get-letter-type-info', async (_event, typeId: string) => {
    return getLetterTypeInfo(typeId)
  })

  // ── Database: Letters ───────────────────────────────────────────────────────

  ipcMain.handle('save-letter', async (_event, letter: NewLetter) => {
    let persistedImagePath = letter.image_path
    try {
      const imagesDir = join(app.getPath('userData'), 'images')
      mkdirSync(imagesDir, { recursive: true })
      const destPath = join(imagesDir, basename(letter.image_path))
      if (!existsSync(destPath) && existsSync(letter.image_path)) {
        copyFileSync(letter.image_path, destPath)
      }
      persistedImagePath = existsSync(destPath) ? destPath : letter.image_path
    } catch (e) {
      console.warn('[BriefKlar] Could not persist image:', e)
    }
    return dbSaveLetter({ ...letter, id: letter.id || uuidv4(), image_path: persistedImagePath })
  })

  ipcMain.handle('get-letters', async () => {
    return dbGetLetters()
  })

  ipcMain.handle('get-letter', async (_event, id: string) => {
    return dbGetLetter(id)
  })

  ipcMain.handle('update-letter', async (_event, id: string, updates: any) => {
    dbUpdateLetter(id, updates)
  })

  ipcMain.handle('delete-letter', async (_event, id: string) => {
    cancelReminder(id)
    dbDeleteLetter(id)
  })

  // ── Database: Replies ───────────────────────────────────────────────────────

  ipcMain.handle('save-reply', async (_event, reply: NewReply) => {
    return dbSaveReply({ ...reply, id: reply.id || uuidv4() })
  })

  ipcMain.handle('get-replies', async (_event, letterId: string) => {
    return dbGetReplies(letterId)
  })

  // ── Feedback (misclassification reporting) ──────────────────────────────────

  ipcMain.handle('save-feedback', async (_event, feedback: Feedback) => {
    dbSaveFeedback(feedback)
  })

  ipcMain.handle('get-feedback-stats', async () => {
    return dbGetFeedbackStats()
  })

  ipcMain.handle('export-feedback', async () => {
    return dbExportFeedback()
  })

  // ── Reminders ───────────────────────────────────────────────────────────────

  ipcMain.handle('schedule-reminder', async (_event, letterId: string, remindAt: number) => {
    scheduleReminder(letterId, remindAt, getWindow)
  })

  ipcMain.handle('cancel-reminder', async (_event, letterId: string) => {
    cancelReminder(letterId)
    dbUpdateLetter(letterId, { reminder_at: null })
  })

  // ── Settings ────────────────────────────────────────────────────────────────

  ipcMain.handle('get-setting', async (_event, key: string) => {
    return dbGetSetting(key)
  })

  ipcMain.handle('set-setting', async (_event, key: string, value: string) => {
    dbSetSetting(key, value)
  })

  // ── PDF export ──────────────────────────────────────────────────────────────

  ipcMain.handle('export-pdf', async (_event, content: string, letterId: string) => {
    const letter = dbGetLetter(letterId)
    if (!letter) throw new Error('Letter not found')
    return exportReplyToPdf(content, letter)
  })

  ipcMain.handle('export-analysis-pdf', async (_event, letterId: string) => {
    const letter = dbGetLetter(letterId)
    if (!letter) throw new Error('Letter not found')
    return exportAnalysisToPdf(letter)
  })

  // ── Backup / Restore ────────────────────────────────────────────────────────

  ipcMain.handle('export-backup', async () => {
    return exportBackup()
  })

  ipcMain.handle('import-backup', async () => {
    return importBackup()
  })

  // ── AI Reply ────────────────────────────────────────────────────────────────

  ipcMain.handle('ai-generate-reply', async (_event, letterId: string) => {
    const apiKey = dbGetSetting('gemini_api_key')
    if (!apiKey) throw new Error('No Gemini API key configured. Go to Settings to add one.')
    const letter = dbGetLetter(letterId)
    if (!letter) throw new Error('Letter not found')
    return generateAiReply(apiKey, letter)
  })

  ipcMain.handle('test-api-key', async (_event, apiKey: string) => {
    return testApiKey(apiKey)
  })

  // ── Dialogs ─────────────────────────────────────────────────────────────────

  ipcMain.handle('show-confirm-dialog', async (_event, message: string, detail?: string) => {
    const win = getWindow()
    const result = await dialog.showMessageBox(win ?? new BrowserWindow({ show: false }), {
      type: 'warning',
      buttons: ['Cancel', 'Confirm'],
      defaultId: 0,
      cancelId: 0,
      message,
      detail: detail ?? '',
    })
    return result.response === 1
  })

  // ── Calendar export ──────────────────────────────────────────────────────────

  ipcMain.handle('export-calendar', async (_event, letterId: string) => {
    const letter = dbGetLetter(letterId)
    if (!letter || !letter.deadline) return null
    const icsContent = generateIcs(letter)
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Calendar Event',
      defaultPath: 'briefklar-deadline.ics',
      filters: [{ name: 'Calendar Files', extensions: ['ics'] }]
    })
    if (!filePath) return null
    writeFileSync(filePath, icsContent, 'utf-8')
    shell.openPath(filePath)
    return filePath
  })

  ipcMain.handle('get-calendar-qr', async (_event, letterId: string) => {
    const letter = dbGetLetter(letterId)
    if (!letter || !letter.deadline) return null
    return startCalendarServer(letter)
  })

  ipcMain.handle('stop-calendar-server', async () => {
    await stopCalendarServer()
  })
}
