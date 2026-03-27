/**
 * Feedback system — tracks user corrections to letter classifications.
 * Stores corrections in a local SQLite table so the app can learn
 * from misclassifications over time (future: weighted pattern boosting).
 */
import { getDb } from './db'

export interface Feedback {
  id: string
  letter_id: string
  original_type: string
  corrected_type: string
  raw_text_snippet: string
  created_at: number
}

// Table is created in db.ts initDb() — no-op kept for compatibility
export function initFeedbackTable(): void {}

export function dbSaveFeedback(feedback: Feedback): void {
  const db = getDb()
  db.prepare(`
    INSERT OR REPLACE INTO feedback (id, letter_id, original_type, corrected_type, raw_text_snippet, created_at)
    VALUES (@id, @letter_id, @original_type, @corrected_type, @raw_text_snippet, @created_at)
  `).run(feedback)
}

export function dbGetFeedbackStats(): {
  totalCorrections: number
  topMisclassified: Array<{ original: string; corrected: string; count: number }>
} {
  const db = getDb()
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM feedback').get() as any)?.cnt ?? 0
  const top = db.prepare(`
    SELECT original_type as original, corrected_type as corrected, COUNT(*) as count
    FROM feedback
    GROUP BY original_type, corrected_type
    ORDER BY count DESC
    LIMIT 10
  `).all() as Array<{ original: string; corrected: string; count: number }>

  return { totalCorrections: total, topMisclassified: top }
}

export function dbExportFeedback(): Feedback[] {
  const db = getDb()
  return db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all() as Feedback[]
}
