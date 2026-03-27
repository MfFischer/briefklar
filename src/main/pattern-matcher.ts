import { readFileSync } from 'fs'
import { join } from 'path'
import type { LetterAnalysis } from '../shared/types'

interface LetterType {
  id: string
  label: string
  labelDe: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  senderPatterns: string[]
  subjectPatterns: string[]
  bodyPatterns: string[]
  whatItIs: string
  whatToDo: string[]
  consequence: string
  deadlineRule: string
  replyTemplateId: string | null
  freeHelp?: string[]
}

let letterTypes: LetterType[] | null = null

const FALLBACK_TYPES: LetterType[] = [
  {
    id: 'unbekannt',
    label: 'Unknown Letter',
    labelDe: 'Unbekannter Brief',
    urgency: 'medium',
    senderPatterns: [],
    subjectPatterns: [],
    bodyPatterns: [],
    whatItIs: 'This letter could not be identified automatically. Please read it carefully.',
    whatToDo: ['Read the letter carefully.', 'Check if a deadline or action is required.', 'Contact the sender if you are unsure.'],
    consequence: 'Unknown — verify with the sender.',
    deadlineRule: 'none',
    replyTemplateId: null,
  },
]

function getLetterTypes(): LetterType[] {
  if (letterTypes) return letterTypes
  const paths = [
    join(process.resourcesPath ?? '', 'knowledge-base', 'letters.json'),
    join(__dirname, '..', '..', '..', 'knowledge-base', 'letters.json'),
    join(__dirname, '..', '..', 'knowledge-base', 'letters.json'),
  ]
  for (const p of paths) {
    try {
      letterTypes = JSON.parse(readFileSync(p, 'utf-8'))
      return letterTypes!
    } catch { /* try next */ }
  }
  console.warn('[BriefKlar] Could not load knowledge-base/letters.json — using fallback types')
  letterTypes = FALLBACK_TYPES
  return letterTypes
}

// ── Fuzzy matching helpers ────────────────────────────────────────────────────

/**
 * Levenshtein distance — number of single-char edits to transform a into b.
 * Used for OCR error tolerance (e.g. "F1nanzamt" ≈ "Finanzamt").
 */
function levenshtein(a: string, b: string): number {
  const la = a.length
  const lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la

  let prev = Array.from({ length: lb + 1 }, (_, i) => i)
  let curr = new Array(lb + 1)

  for (let i = 1; i <= la; i++) {
    curr[0] = i
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[lb]
}

/**
 * Common OCR character confusions for German text.
 * Normalises text before matching to handle systematic OCR errors.
 */
function normalizeOcrText(text: string): string {
  return text
    // Broken umlauts: OCR sometimes splits ä→a+combining diaeresis
    .replace(/a\u0308/g, 'ä')
    .replace(/o\u0308/g, 'ö')
    .replace(/u\u0308/g, 'ü')
    .replace(/A\u0308/g, 'Ä')
    .replace(/O\u0308/g, 'Ö')
    .replace(/U\u0308/g, 'Ü')
    // Common ligature breaks
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    // Normalise whitespace
    .replace(/\s+/g, ' ')
}

/**
 * Fuzzy substring search: checks if `pattern` appears in `text` allowing
 * up to `maxDist` character edits. Slides a window of pattern.length ± 2
 * across the text and checks Levenshtein distance.
 */
function fuzzyIncludes(text: string, pattern: string, maxDist: number): boolean {
  const tLower = text.toLowerCase()
  const pLower = pattern.toLowerCase()

  // Fast path: exact substring match
  if (tLower.includes(pLower)) return true

  // Skip fuzzy for very short patterns (too many false positives)
  if (pLower.length < 4) return false

  // Sliding window fuzzy match
  const windowMin = Math.max(0, pLower.length - 2)
  const windowMax = pLower.length + 2

  for (let winSize = windowMin; winSize <= windowMax; winSize++) {
    for (let i = 0; i <= tLower.length - winSize; i++) {
      const window = tLower.substring(i, i + winSize)
      if (levenshtein(window, pLower) <= maxDist) return true
    }
  }
  return false
}

/**
 * Compute max allowed edit distance for a pattern.
 *   < 6 chars → 0 (exact only)
 *   6-10 chars → 1
 *   11-20 chars → 2
 *   > 20 chars → 3
 */
function maxEditDistance(pattern: string): number {
  const len = pattern.length
  if (len < 6) return 0
  if (len <= 10) return 1
  if (len <= 20) return 2
  return 3
}

/**
 * Check if pattern matches in text, using fuzzy matching when appropriate.
 */
function patternMatches(text: string, pattern: string): boolean {
  const dist = maxEditDistance(pattern)
  if (dist === 0) return text.toLowerCase().includes(pattern.toLowerCase())
  return fuzzyIncludes(text, pattern, dist)
}

// ── Regex helpers ─────────────────────────────────────────────────────────────

const AMOUNT_PATTERN = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:EUR|€)/gi

// ── Public helpers ────────────────────────────────────────────────────────────

export function getAllLetterTypes(): Array<{ id: string; label: string; labelDe: string }> {
  return getLetterTypes().map((t) => ({ id: t.id, label: t.label, labelDe: t.labelDe }))
}

export function getLetterTypeInfo(typeId: string): LetterType | null {
  return getLetterTypes().find((t) => t.id === typeId) ?? null
}

// ── Main analyser ─────────────────────────────────────────────────────────────

export function analyzeText(rawText: string): LetterAnalysis {
  const text = normalizeOcrText(rawText)
  const textLower = text.toLowerCase()
  const types = getLetterTypes()

  // Score each letter type with fuzzy matching
  const scores = types
    .filter((t) => t.id !== 'unbekannt')
    .map((type) => {
      let score = 0
      let senderHit = false
      let subjectHit = false

      for (const p of type.senderPatterns) {
        if (patternMatches(text, p)) {
          score += 3
          senderHit = true
        }
      }
      for (const p of type.subjectPatterns) {
        if (patternMatches(text, p)) {
          score += 4
          subjectHit = true
        }
      }
      for (const p of type.bodyPatterns) {
        if (patternMatches(text, p)) {
          score += 2
        }
      }

      // Require at least one subject OR sender hit for a valid match
      if (!senderHit && !subjectHit) score = 0

      return { type, score, senderHit, subjectHit }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scores[0]
  const subjectMax = best ? best.type.subjectPatterns.length * 4 : 1
  const subjectScore = best
    ? best.type.subjectPatterns.filter((p) => patternMatches(text, p)).length * 4
    : 0
  const rawConf = best ? (subjectScore > 0 ? subjectScore / Math.max(subjectMax * 0.5, 4) : best.score / Math.max(subjectMax * 1.5, 6)) : 0
  const confidence = Math.min(rawConf, 1)
  const matched = confidence > 0.2 ? best?.type : types.find((t) => t.id === 'unbekannt')!

  const letterDate = extractLetterDate(text)
  return {
    letterType: matched.id,
    typeLabel: matched.label,
    typeLabelDe: matched.labelDe,
    confidence,
    sender: extractSender(text),
    amount: extractAmount(text),
    currency: 'EUR',
    letterDate,
    deadline: extractDeadline(text, matched.deadlineRule, letterDate),
    betreff: extractBetreff(text),
    referenceNumbers: extractReferenceNumbers(text),
    whatItIs: matched.whatItIs,
    whatToDo: matched.whatToDo,
    consequence: matched.consequence,
    urgency: matched.urgency,
    replyTemplateId: matched.replyTemplateId,
    freeHelp: matched.freeHelp ?? []
  }
}

// ── Field extractors ──────────────────────────────────────────────────────────

function extractSender(text: string): string | null {
  const firstLines = text.split('\n').slice(0, 6).join('\n')

  const senderMap: Array<[string, string]> = [
    ['Bundeszentralamt für Steuern', 'Bundeszentralamt für Steuern'],
    ['Bundeszentralamt',             'Bundeszentralamt für Steuern'],
    ['für Steuern',                  'Bundeszentralamt für Steuern'],
    ['BZSt',                         'Bundeszentralamt für Steuern'],
    ['Finanzamt',                    'Finanzamt'],
    ['Amtsgericht',                  'Amtsgericht'],
    ['Landgericht',                  'Landgericht'],
    ['Krankenkasse',                 'Krankenkasse'],
    ['AOK',                          'AOK'],
    ['Techniker Krankenkasse',       'Techniker Krankenkasse'],
    ['DAK',                          'DAK'],
    ['Barmer',                       'Barmer'],
    ['Deutsche Rentenversicherung',  'Deutsche Rentenversicherung'],
    ['Rentenversicherung',           'Deutsche Rentenversicherung'],
    ['Jobcenter',                    'Jobcenter'],
    ['Agentur für Arbeit',           'Agentur für Arbeit'],
    ['Ausländerbehörde',             'Ausländerbehörde'],
    ['Ausländeramt',                 'Ausländerbehörde'],
    ['Beitragsservice',              'Beitragsservice (GEZ)'],
    ['Familienkasse',                'Familienkasse'],
    ['Studentenwerk',                'Studentenwerk'],
    ['Bundesagentur für Arbeit',     'Bundesagentur für Arbeit'],
    ['Kraftfahrtbundesamt',          'Kraftfahrtbundesamt'],
    ['Bußgeldstelle',                'Bußgeldstelle'],
    ['Ordnungsamt',                  'Ordnungsamt'],
    ['Landratsamt',                  'Landratsamt'],
    ['Stadtverwaltung',              'Stadtverwaltung'],
    ['Einwohnermeldeamt',            'Einwohnermeldeamt'],
    ['Standesamt',                   'Standesamt'],
  ]

  // Use fuzzy matching for sender detection too
  for (const [match, canonical] of senderMap) {
    if (patternMatches(firstLines, match)) {
      return canonical
    }
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines[0]?.substring(0, 60) ?? null
}

function extractBetreff(text: string): string | null {
  const m = text.match(/(?:Betreff|Betrifft|Betr\.|Wegen|Ihr Zeichen|Ihre Nachricht)[:\s]+(.+)/i)
  if (m) return m[1].trim().substring(0, 200)

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines.slice(2, 10)) {
    if (line.length > 10 && line.length < 120 &&
      /(?:bescheid|mitteilung|anforderung|aufforderung|mahnung|bescheinigung|bestätigung|antrag|ausweis|identifikation|nummer|beitrag|abrechnung|kündigung)/i.test(line)) {
      return line
    }
  }
  return null
}

function extractReferenceNumbers(text: string): string[] {
  const found: string[] = []

  const ustId = text.match(/(?:USt-IdNr\.?|USt\.?-?Id\.?|Umsatzsteuer-?Id)[:\s]*([A-Z]{2}[\s\d]{9,14})/i)
    ?? text.match(/\b(DE[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d)\b/)
  if (ustId) found.push('USt-IdNr: ' + ustId[1].replace(/\s/g, ''))

  const steuerId = text.match(/(?:Steueridentifikationsnummer|steuerliche Identifikationsnummer|IdNr)[:\s]*(\d[\s\d]{10,14})/i)
  if (steuerId) {
    const digits = steuerId[1].replace(/\s/g, '')
    if (digits.length === 11) found.push('Steuer-ID: ' + digits)
  }

  const steuerNr = text.match(/(?:Steuernummer|St\.?-?Nr\.?)[:\s]*(\d{2,3}[/\s]\d{3}[/\s]\d{4,5})/i)
  if (steuerNr) found.push('Steuernummer: ' + steuerNr[1].replace(/\s/g, ''))

  const az = text.match(/(?:Aktenzeichen|Az\.|Gz\.|Geschäftszeichen)[:\s]+(\S+(?:\s\S+)?)/i)
  if (az) found.push('Az: ' + az[1].trim())

  const iban = text.match(/\b(DE\d{2}\s?(?:\d{4}\s?){4}\d{2})\b/)
  if (iban) found.push('IBAN: ' + iban[1].replace(/\s/g, ''))

  const gueltigVom = text.match(/(?:gültig\s+mit\s+Wirkung\s+vom|gültig\s+ab)[:\s]*(\d{1,2}\.\d{1,2}\.\d{4})/i)
  if (gueltigVom) found.push('Gültig ab: ' + gueltigVom[1])

  return found
}

function extractLetterDate(text: string): string | null {
  const DE_MONTHS: Record<string, number> = {
    januar:1, februar:2, märz:3, maerz:3, april:4, mai:5, juni:6,
    juli:7, august:8, september:9, oktober:10, november:11, dezember:12
  }
  const numericDate = /(?:Datum|vom|stand)[:\s]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i.exec(text)
    ?? /(?:^|\n)\s*(?:\w+,\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})\s*(?:\n|$)/.exec(text)
  if (numericDate) {
    const d = new Date(parseInt(numericDate[3]), parseInt(numericDate[2]) - 1, parseInt(numericDate[1]))
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString().split('T')[0]
  }
  const monthDate = /(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i.exec(text)
  if (monthDate) {
    const mo = DE_MONTHS[monthDate[2].toLowerCase()]
    if (mo) {
      const d = new Date(parseInt(monthDate[3]), mo - 1, parseInt(monthDate[1]))
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    }
  }
  return null
}

function extractAmount(text: string): number | null {
  let match: RegExpExecArray | null

  const actionPattern = /(?:Nachzahlung|Nachforderung|Erstattung|Rückerstattung|Rückforderung|zu\s+zahlen|Zahlbetrag|fällig(?:er\s+Betrag)?)[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€)/gi
  match = actionPattern.exec(text)
  if (match) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    if (!isNaN(val) && val > 0 && val < 1_000_000) return val
  }

  const pattern = new RegExp(AMOUNT_PATTERN.source, 'gi')
  const matches: number[] = []
  while ((match = pattern.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    if (!isNaN(val) && val > 0 && val < 1_000_000) matches.push(val)
  }
  return matches[0] ?? null
}

function extractDeadline(text: string, rule: string, letterDate: string | null): string | null {
  const baseDate = (() => {
    if (letterDate) {
      const d = new Date(letterDate)
      d.setDate(d.getDate() + 3)
      return d
    }
    return new Date()
  })()
  const dates: Date[] = []
  let m: RegExpExecArray | null

  const DE_MONTHS: Record<string, number> = {
    januar:1, februar:2, märz:3, maerz:3, april:4, mai:5, juni:6,
    juli:7, august:8, september:9, oktober:10, november:11, dezember:12
  }

  const pushIfFuture = (d: Date) => { if (d > new Date() && !isNaN(d.getTime())) dates.push(d) }

  const numericCtx = /(?:gültig\s+bis|Gültigkeitsdatum|Gültigkeit\s+bis|befristet\s+bis|Ablaufdatum|Frist|spätestens|zahlen\s+bis|Einspruch\s+bis|bis\s+zum|bis\s+spätestens)[\s\S]{0,60}?(\d{1,2})\.(\d{1,2})\.(\d{4})/gi
  while ((m = numericCtx.exec(text)) !== null) {
    pushIfFuture(new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])))
  }

  const monthCtx = /(?:gültig\s+bis|Gültigkeitsdatum|befristet\s+bis|Ablaufdatum|Frist|spätestens|bis\s+zum)[\s\S]{0,80}?(\d{1,2})\.\s*(Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/gi
  while ((m = monthCtx.exec(text)) !== null) {
    const mo = DE_MONTHS[m[2].toLowerCase()]
    if (mo) pushIfFuture(new Date(parseInt(m[3]), mo - 1, parseInt(m[1])))
  }

  const gueltigBis = /gültig\s+bis[:\s]*(\d{1,2})\.(\d{1,2})\.(\d{2,4})/gi
  while ((m = gueltigBis.exec(text)) !== null) {
    const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
    pushIfFuture(new Date(yr, parseInt(m[2]) - 1, parseInt(m[1])))
  }

  if (dates.length > 0) {
    dates.sort((a, b) => a.getTime() - b.getTime())
    return dates[0].toISOString().split('T')[0]
  }

  switch (rule) {
    case '14_days_from_delivery':
    case '14_days_einspruch': {
      const d = new Date(baseDate); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]
    }
    case '1_month':
    case 'explicit_or_1_month': {
      const d = new Date(baseDate); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]
    }
    case 'explicit_or_30_days': {
      const d = new Date(baseDate); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]
    }
    case 'explicit_or_14_days': {
      const d = new Date(baseDate); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]
    }
    case '12_months_from_receipt': {
      const d = new Date(baseDate); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]
    }
    default:
      return null
  }
}
