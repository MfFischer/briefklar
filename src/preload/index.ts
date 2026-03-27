import { contextBridge, ipcRenderer } from 'electron'
import type {
  HandoffInfo, Letter, NewLetter, LetterAnalysis, ProcessedImage,
  Reply, NewReply, LetterTypeSummary, Feedback
} from '../shared/types'

const api = {
  // ── Handoff ────────────────────────────────────────────────────────────────
  startHandoffServer: (): Promise<HandoffInfo> =>
    ipcRenderer.invoke('start-handoff-server'),
  stopHandoffServer: (): Promise<void> =>
    ipcRenderer.invoke('stop-handoff-server'),
  onPhotoReceived: (cb: (imagePath: string) => void) => {
    ipcRenderer.on('photo-received', (_e, path) => cb(path))
    return () => ipcRenderer.removeAllListeners('photo-received')
  },
  onOpenLetter: (cb: (id: string) => void) => {
    ipcRenderer.on('open-letter', (_e, id) => cb(id))
    return () => ipcRenderer.removeAllListeners('open-letter')
  },

  // ── Pipeline ───────────────────────────────────────────────────────────────
  processLetter: (imagePath: string): Promise<{
    processed: ProcessedImage
    rawText: string
    analysis: LetterAnalysis
  }> => ipcRenderer.invoke('process-letter', imagePath),

  analyzeText: (rawText: string): Promise<LetterAnalysis> =>
    ipcRenderer.invoke('analyze-text', rawText),

  // ── Knowledge base ─────────────────────────────────────────────────────────
  getLetterTypes: (): Promise<LetterTypeSummary[]> =>
    ipcRenderer.invoke('get-letter-types'),

  getLetterTypeInfo: (typeId: string): Promise<{
    id: string; label: string; labelDe: string; urgency: string;
    whatItIs: string; whatToDo: string[]; consequence: string;
    replyTemplateId: string | null
  } | null> => ipcRenderer.invoke('get-letter-type-info', typeId),

  // ── Letters ────────────────────────────────────────────────────────────────
  saveLetter: (letter: NewLetter): Promise<Letter> =>
    ipcRenderer.invoke('save-letter', letter),
  getLetters: (): Promise<Letter[]> =>
    ipcRenderer.invoke('get-letters'),
  getLetter: (id: string): Promise<Letter | null> =>
    ipcRenderer.invoke('get-letter', id),
  updateLetter: (id: string, updates: Partial<Letter>): Promise<void> =>
    ipcRenderer.invoke('update-letter', id, updates),
  deleteLetter: (id: string): Promise<void> =>
    ipcRenderer.invoke('delete-letter', id),

  // ── Replies ────────────────────────────────────────────────────────────────
  saveReply: (reply: NewReply): Promise<Reply> =>
    ipcRenderer.invoke('save-reply', reply),
  getReplies: (letterId: string): Promise<Reply[]> =>
    ipcRenderer.invoke('get-replies', letterId),

  // ── Feedback (misclassification reporting) ─────────────────────────────────
  saveFeedback: (feedback: Feedback): Promise<void> =>
    ipcRenderer.invoke('save-feedback', feedback),
  getFeedbackStats: (): Promise<{ totalCorrections: number; topMisclassified: any[] }> =>
    ipcRenderer.invoke('get-feedback-stats'),
  exportFeedback: (): Promise<any[]> =>
    ipcRenderer.invoke('export-feedback'),

  // ── Reminders ──────────────────────────────────────────────────────────────
  scheduleReminder: (letterId: string, remindAt: number): Promise<void> =>
    ipcRenderer.invoke('schedule-reminder', letterId, remindAt),
  cancelReminder: (letterId: string): Promise<void> =>
    ipcRenderer.invoke('cancel-reminder', letterId),

  // ── Settings ───────────────────────────────────────────────────────────────
  getSetting: (key: string): Promise<string | null> =>
    ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string): Promise<void> =>
    ipcRenderer.invoke('set-setting', key, value),

  // ── PDF export ─────────────────────────────────────────────────────────────
  exportPdf: (content: string, letterId: string): Promise<string | null> =>
    ipcRenderer.invoke('export-pdf', content, letterId),
  exportAnalysisPdf: (letterId: string): Promise<string | null> =>
    ipcRenderer.invoke('export-analysis-pdf', letterId),

  // ── Backup ─────────────────────────────────────────────────────────────────
  exportBackup: (): Promise<boolean> =>
    ipcRenderer.invoke('export-backup'),
  importBackup: (): Promise<boolean> =>
    ipcRenderer.invoke('import-backup'),

  // ── AI reply ───────────────────────────────────────────────────────────────
  aiGenerateReply: (letterId: string): Promise<string> =>
    ipcRenderer.invoke('ai-generate-reply', letterId),
  testApiKey: (apiKey: string): Promise<boolean> =>
    ipcRenderer.invoke('test-api-key', apiKey),

  // ── Calendar export ─────────────────────────────────────────────────────────
  exportCalendar: (letterId: string): Promise<string | null> =>
    ipcRenderer.invoke('export-calendar', letterId),
  getCalendarQr: (letterId: string): Promise<{ qrDataUrl: string; url: string } | null> =>
    ipcRenderer.invoke('get-calendar-qr', letterId),
  stopCalendarServer: (): Promise<void> =>
    ipcRenderer.invoke('stop-calendar-server'),

  // ── Native dialogs ────────────────────────────────────────────────────────
  showConfirmDialog: (message: string, detail?: string): Promise<boolean> =>
    ipcRenderer.invoke('show-confirm-dialog', message, detail),
}

contextBridge.exposeInMainWorld('briefklar', api)

export type BriefKlarAPI = typeof api
