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

function getLetterTypes(): LetterType[] {
  if (letterTypes) return letterTypes
  // Load from knowledge-base at app root (dev) or resources (prod)
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
  throw new Error('Could not load knowledge-base/letters.json')
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
  const text = rawText
  const textLower = text.toLowerCase()
  const types = getLetterTypes()

  // Score each letter type
  const scores = types
    .filter((t) => t.id !== 'unbekannt')
    .map((type) => {
      let score = 0

      for (const p of type.senderPatterns) {
        if (textLower.includes(p.toLowerCase())) score += 3
      }
      for (const p of type.subjectPatterns) {
        if (textLower.includes(p.toLowerCase())) score += 4
      }
      for (const p of type.bodyPatterns) {
        if (textLower.includes(p.toLowerCase())) score += 2
      }

      return { type, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const best = scores[0]
  const maxPossible = best
    ? (best.type.senderPatterns.length * 3 +
       best.type.subjectPatterns.length * 4 +
       best.type.bodyPatterns.length * 2)
    : 1
  const confidence = best ? Math.min(best.score / Math.max(maxPossible * 0.4, 1), 1) : 0
  const matched = confidence > 0.15 ? best?.type : types.find((t) => t.id === 'unbekannt')!

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
  // Try to find sender in first 5 lines
  const firstLines = text.split('\n').slice(0, 6).join('\n')

  // Canonical sender map: partial OCR match → correct full name
  // Handles cases where OCR cuts off the start of long sender names
  const senderMap: Array<[string, string]> = [
    ['Bundeszentralamt für Steuern', 'Bundeszentralamt für Steuern'],
    ['Bundeszentralamt',             'Bundeszentralamt für Steuern'],
    ['für Steuern',                  'Bundeszentralamt für Steuern'], // OCR cuts front
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
  for (const [match, canonical] of senderMap) {
    if (firstLines.includes(match)) return canonical
  }

  // Fall back to first non-empty line
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines[0]?.substring(0, 60) ?? null
}

function extractBetreff(text: string): string | null {
  // Match "Betreff:", "Betrifft:", "Betr.:", "Re:", "Wegen:" lines
  const m = text.match(/(?:Betreff|Betrifft|Betr\.|Wegen|Ihr Zeichen|Ihre Nachricht)[:\s]+(.+)/i)
  if (m) return m[1].trim().substring(0, 200)

  // Fallback: look for a standalone short line between salutation and body
  // that looks like a subject (all caps, or contains common subject words)
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

  // USt-IdNr: DE + 9 digits (OCR may insert spaces between digit groups)
  const ustId = text.match(/(?:USt-IdNr\.?|USt\.?-?Id\.?|Umsatzsteuer-?Id)[:\s]*([A-Z]{2}[\s\d]{9,14})/i)
    ?? text.match(/\b(DE[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d[\s]?\d)\b/)
  if (ustId) found.push('USt-IdNr: ' + ustId[1].replace(/\s/g, ''))

  // Personal Steuer-ID (11 digits, no leading 0)
  const steuerId = text.match(/(?:Steueridentifikationsnummer|steuerliche Identifikationsnummer|IdNr)[:\s]*(\d[\s\d]{10,14})/i)
  if (steuerId) {
    const digits = steuerId[1].replace(/\s/g, '')
    if (digits.length === 11) found.push('Steuer-ID: ' + digits)
  }

  // Steuernummer: format like 123/456/78901
  const steuerNr = text.match(/(?:Steuernummer|St\.?-?Nr\.?)[:\s]*(\d{2,3}[/\s]\d{3}[/\s]\d{4,5})/i)
  if (steuerNr) found.push('Steuernummer: ' + steuerNr[1].replace(/\s/g, ''))

  // Aktenzeichen / Geschäftszeichen
  const az = text.match(/(?:Aktenzeichen|Az\.|Gz\.|Geschäftszeichen)[:\s]+(\S+(?:\s\S+)?)/i)
  if (az) found.push('Az: ' + az[1].trim())

  // IBAN (for payment letters)
  const iban = text.match(/\b(DE\d{2}\s?(?:\d{4}\s?){4}\d{2})\b/)
  if (iban) found.push('IBAN: ' + iban[1].replace(/\s/g, ''))

  // "Gültig mit Wirkung vom" — issue date for USt-IdNr (informational, not a deadline)
  const gueltigVom = text.match(/(?:gültig\s+mit\s+Wirkung\s+vom|gültig\s+ab)[:\s]*(\d{1,2}\.\d{1,2}\.\d{4})/i)
  if (gueltigVom) found.push('Gültig ab: ' + gueltigVom[1])

  return found
}

function extractLetterDate(text: string): string | null {
  const DE_MONTHS: Record<string, number> = {
    januar:1, februar:2, märz:3, maerz:3, april:4, mai:5, juni:6,
    juli:7, august:8, september:9, oktober:10, november:11, dezember:12
  }
  // "Datum: 24.03.2026" or "Saarlouis, 24.03.2026" or standalone date in header
  const numericDate = /(?:Datum|vom|stand)[:\s]*(\d{1,2})\.(\d{1,2})\.(\d{4})/i.exec(text)
    ?? /(?:^|\n)\s*(?:\w+,\s*)?(\d{1,2})\.(\d{1,2})\.(\d{4})\s*(?:\n|$)/.exec(text)
  if (numericDate) {
    const d = new Date(parseInt(numericDate[3]), parseInt(numericDate[2]) - 1, parseInt(numericDate[1]))
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString().split('T')[0]
  }
  // "24. März 2026"
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

  // Priority: action amounts — what you actually owe or get back
  const actionPattern = /(?:Nachzahlung|Nachforderung|Erstattung|Rückerstattung|Rückforderung|zu\s+zahlen|Zahlbetrag|fällig(?:er\s+Betrag)?)[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€)/gi
  match = actionPattern.exec(text)
  if (match) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    if (!isNaN(val) && val > 0 && val < 1_000_000) return val
  }

  // Fallback: first currency amount in the document
  const pattern = new RegExp(AMOUNT_PATTERN.source, 'gi')
  const matches: number[] = []
  while ((match = pattern.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    if (!isNaN(val) && val > 0 && val < 1_000_000) matches.push(val)
  }
  return matches[0] ?? null
}

function extractDeadline(text: string, rule: string, letterDate: string | null): string | null {
  // § 122 AO — 3-Tages-Fiktion: letter legally deemed delivered 3 days after postmark
  // Use letterDate + 3 days as the base for rule-based deadlines (not today)
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

  // Pattern 1: keyword + numeric date dd.mm.yyyy (within 60 chars)
  const numericCtx = /(?:gültig\s+bis|Gültigkeitsdatum|Gültigkeit\s+bis|befristet\s+bis|Ablaufdatum|Frist|spätestens|zahlen\s+bis|Einspruch\s+bis|bis\s+zum|bis\s+spätestens)[\s\S]{0,60}?(\d{1,2})\.(\d{1,2})\.(\d{4})/gi
  while ((m = numericCtx.exec(text)) !== null) {
    pushIfFuture(new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])))
  }

  // Pattern 2: keyword + German month name  e.g. "gültig bis 31. Dezember 2027"
  const monthCtx = /(?:gültig\s+bis|Gültigkeitsdatum|befristet\s+bis|Ablaufdatum|Frist|spätestens|bis\s+zum)[\s\S]{0,80}?(\d{1,2})\.\s*(Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/gi
  while ((m = monthCtx.exec(text)) !== null) {
    const mo = DE_MONTHS[m[2].toLowerCase()]
    if (mo) pushIfFuture(new Date(parseInt(m[3]), mo - 1, parseInt(m[1])))
  }

  // Pattern 3: standalone "gültig bis" line — date anywhere in same/next line
  const gueltigBis = /gültig\s+bis[:\s]*(\d{1,2})\.(\d{1,2})\.(\d{2,4})/gi
  while ((m = gueltigBis.exec(text)) !== null) {
    const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
    pushIfFuture(new Date(yr, parseInt(m[2]) - 1, parseInt(m[1])))
  }

  if (dates.length > 0) {
    dates.sort((a, b) => a.getTime() - b.getTime())
    return dates[0].toISOString().split('T')[0]
  }

  // Apply rule-based fallback (using baseDate = letterDate + 3 days per § 122 AO, or today)
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
