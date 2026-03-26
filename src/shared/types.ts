export interface Letter {
  id: string
  scanned_at: number
  image_path: string
  raw_text: string
  letter_type: string | null
  type_label: string | null
  sender: string | null
  amount: number | null
  currency: string
  deadline: number | null
  urgency: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  what_it_is: string | null
  what_to_do: string[]
  consequence: string | null
  status: 'pending' | 'done' | 'ignored'
  reminder_at: number | null
  notes: string | null
  reply_template_id: string | null
}

export interface LetterTypeSummary {
  id: string
  label: string
  labelDe: string
}

export type NewLetter = Omit<Letter, 'status' | 'reminder_at' | 'notes'>

export interface Reply {
  id: string
  letter_id: string
  created_at: number
  content: string
  template_id: string | null
}

export type NewReply = Reply

export interface LetterAnalysis {
  letterType: string
  typeLabel: string
  typeLabelDe: string
  confidence: number
  sender: string | null
  amount: number | null
  currency: string
  deadline: string | null
  letterDate: string | null       // date printed on the letter (Datum)
  betreff: string | null          // extracted subject line from letter
  referenceNumbers: string[]      // USt-IdNr, Steuernummer, Aktenzeichen etc.
  whatItIs: string
  whatToDo: string[]
  consequence: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  replyTemplateId: string | null
  freeHelp: string[]              // free help resources per letter type
}

export interface ProcessedImage {
  id: string
  originalPath: string
  processedPath: string
  width: number
  height: number
}

export interface HandoffInfo {
  port: number
  localIp: string
  url: string
  qrDataUrl: string
}
