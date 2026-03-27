import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import type { Letter, NewLetter, Reply, NewReply } from '../shared/types'

let db: Database.Database

export function initDb(): void {
  const dataDir = join(app.getPath('userData'), 'data')
  mkdirSync(dataDir, { recursive: true })

  db = new Database(join(dataDir, 'briefklar.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id          TEXT PRIMARY KEY,
      scanned_at  INTEGER NOT NULL,
      image_path  TEXT NOT NULL,
      raw_text    TEXT NOT NULL,
      letter_type TEXT,
      type_label  TEXT,
      sender      TEXT,
      amount      REAL,
      currency    TEXT DEFAULT 'EUR',
      deadline    INTEGER,
      urgency     TEXT DEFAULT 'medium',
      confidence  REAL DEFAULT 0,
      what_it_is  TEXT,
      what_to_do  TEXT,
      consequence TEXT,
      status      TEXT DEFAULT 'pending',
      reminder_at INTEGER,
      notes       TEXT,
      reply_template_id TEXT,
      free_help   TEXT
    );

    CREATE TABLE IF NOT EXISTS replies (
      id          TEXT PRIMARY KEY,
      letter_id   TEXT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
      created_at  INTEGER NOT NULL,
      content     TEXT NOT NULL,
      template_id TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id               TEXT PRIMARY KEY,
      letter_id        TEXT NOT NULL,
      original_type    TEXT NOT NULL,
      corrected_type   TEXT NOT NULL,
      raw_text_snippet TEXT,
      created_at       INTEGER NOT NULL
    );
  `)

  // Migrations: add columns to existing DBs that predate them
  const migrations = [
    'ALTER TABLE letters ADD COLUMN confidence REAL DEFAULT 0',
    'ALTER TABLE letters ADD COLUMN free_help TEXT',
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch { /* column already exists — safe to ignore */ }
  }
}

export function getDb(): Database.Database {
  return db
}

export function closeDb(): void {
  db?.close()
}

// ── Letters ──────────────────────────────────────────────────────────────────

export function dbSaveLetter(letter: NewLetter): Letter {
  const stmt = db.prepare(`
    INSERT INTO letters (
      id, scanned_at, image_path, raw_text, letter_type, type_label,
      sender, amount, currency, deadline, urgency, confidence,
      what_it_is, what_to_do, consequence, status,
      reminder_at, notes, reply_template_id, free_help
    ) VALUES (
      @id, @scanned_at, @image_path, @raw_text, @letter_type, @type_label,
      @sender, @amount, @currency, @deadline, @urgency, @confidence,
      @what_it_is, @what_to_do, @consequence, @status,
      @reminder_at, @notes, @reply_template_id, @free_help
    )
  `)
  stmt.run({
    ...letter,
    confidence: letter.confidence ?? 0,
    what_to_do: JSON.stringify(letter.what_to_do),
    free_help: letter.free_help ? JSON.stringify(letter.free_help) : null,
    status: 'pending',
    reminder_at: null,
    notes: null
  })
  return dbGetLetter(letter.id)!
}

export function dbGetLetters(): Letter[] {
  const rows = db.prepare('SELECT * FROM letters ORDER BY scanned_at DESC').all() as any[]
  return rows.map(parseLetterRow)
}

export function dbGetLetter(id: string): Letter | null {
  const row = db.prepare('SELECT * FROM letters WHERE id = ?').get(id) as any
  return row ? parseLetterRow(row) : null
}

export function dbUpdateLetter(id: string, updates: Partial<Letter>): void {
  const allowed = [
    'status', 'reminder_at', 'notes', 'deadline',
    'raw_text', 'letter_type', 'type_label', 'urgency',
    'sender', 'amount', 'what_it_is', 'what_to_do', 'consequence',
    'reply_template_id', 'confidence', 'free_help'
  ]
  const fields = Object.keys(updates).filter((k) => allowed.includes(k))
  if (fields.length === 0) return

  const serialized: any = { ...updates, id }
  if (Array.isArray(serialized.what_to_do)) {
    serialized.what_to_do = JSON.stringify(serialized.what_to_do)
  }
  if (Array.isArray(serialized.free_help)) {
    serialized.free_help = JSON.stringify(serialized.free_help)
  }

  const set = fields.map((f) => `${f} = @${f}`).join(', ')
  db.prepare(`UPDATE letters SET ${set} WHERE id = @id`).run(serialized)
}

export function dbDeleteLetter(id: string): void {
  db.prepare('DELETE FROM letters WHERE id = ?').run(id)
}

// ── Replies ───────────────────────────────────────────────────────────────────

export function dbSaveReply(reply: NewReply): Reply {
  db.prepare(`
    INSERT INTO replies (id, letter_id, created_at, content, template_id)
    VALUES (@id, @letter_id, @created_at, @content, @template_id)
  `).run(reply)
  return db.prepare('SELECT * FROM replies WHERE id = ?').get(reply.id) as Reply
}

export function dbGetReplies(letterId: string): Reply[] {
  return db.prepare('SELECT * FROM replies WHERE letter_id = ? ORDER BY created_at DESC').all(letterId) as Reply[]
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function dbGetSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
  return row?.value ?? null
}

export function dbSetSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLetterRow(row: any): Letter {
  return {
    ...row,
    confidence: row.confidence ?? 0,
    what_to_do: row.what_to_do ? JSON.parse(row.what_to_do) : [],
    free_help: row.free_help ? JSON.parse(row.free_help) : null,
  }
}
