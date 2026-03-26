import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Letter } from '../shared/types'

export async function generateAiReply(apiKey: string, letter: Letter): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const deadline = letter.deadline
    ? new Date(letter.deadline).toLocaleDateString('de-DE')
    : 'nicht angegeben'

  const amount = letter.amount != null
    ? `€${letter.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
    : 'nicht angegeben'

  const prompt = `Du bist ein Assistent, der deutschen Bürgern hilft, auf offizielle Schreiben zu antworten.

Erstelle ein formelles deutsches Antwortschreiben (Antwortbrief) im DIN 5008 Format.

Informationen zum erhaltenen Brief:
- Briefart: ${letter.type_label ?? 'Unbekannt'}
- Absender: ${letter.sender ?? 'Behörde'}
- Betrag: ${amount}
- Frist/Datum: ${deadline}
- Beschreibung: ${letter.what_it_is ?? ''}
- Empfohlene Maßnahmen: ${(letter.what_to_do ?? []).join('; ')}

OCR-Text des Briefs (zur Referenz):
---
${letter.raw_text?.substring(0, 1500) ?? ''}
---

Anweisungen:
- Verwende "Sehr geehrte Damen und Herren," als Anrede
- Nutze diese Platzhalter: [IHR VOLLSTÄNDIGER NAME], [IHRE STRASSE UND NR.], [PLZ STADT]
- Datum: ${new Date().toLocaleDateString('de-DE')}
- Abschluss: "Mit freundlichen Grüßen," gefolgt von [IHR VOLLSTÄNDIGER NAME]
- Halte den Brief präzise und rechtlich korrekt
- Schreibe NUR den Brieftext, keine Erklärungen oder Kommentare

Antwortschreiben:`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  if (!text) throw new Error('Keine Antwort von der KI erhalten.')
  return text
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    await model.generateContent('Antworte mit: OK')
    return true
  } catch {
    return false
  }
}
