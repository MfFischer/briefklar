import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Letter, Reply } from '../../../shared/types'

interface Props {
  letter: Letter
  onSaved: (reply: Reply) => void
  onCancel: () => void
}

// Built-in reply templates (no AI needed — legally verified German)
const TEMPLATES: Record<string, { subject: string; body: string }> = {
  einspruch_steuerbescheid: {
    subject: 'Einspruch gegen Steuerbescheid vom {LETTER_DATE}',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An das {SENDER}

Betreff: Einspruch gegen Steuerbescheid vom {LETTER_DATE}

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Einspruch gegen den Steuerbescheid vom {LETTER_DATE} ein.

Begründung:
{USER_REASON}

Ich bitte um schriftliche Bestätigung des Eingangs.

Mit freundlichen Grüßen,

{USER_NAME}`
  },
  einspruch_bussgeld: {
    subject: 'Einspruch gegen Bußgeldbescheid',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An die {SENDER}

Betreff: Einspruch gegen Bußgeldbescheid

Sehr geehrte Damen und Herren,

gegen den oben genannten Bußgeldbescheid lege ich hiermit fristgerecht Einspruch ein.

Begründung:
{USER_REASON}

Ich beantrage die Einstellung des Verfahrens.

Mit freundlichen Grüßen,

{USER_NAME}`
  },
  widerspruch_mahnung: {
    subject: 'Widerspruch gegen Forderung',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An {SENDER}

Betreff: Widerspruch gegen Ihre Forderung

Sehr geehrte Damen und Herren,

ich widerspreche der in Ihrer Mahnung vom {LETTER_DATE} geltend gemachten Forderung in Höhe von {AMOUNT} EUR.

Begründung:
{USER_REASON}

Sollten Sie an Ihrer Forderung festhalten, bitte ich um Übersendung aller relevanten Unterlagen und Nachweise.

Mit freundlichen Grüßen,

{USER_NAME}`
  },
  widerspruch_mahnbescheid: {
    subject: 'Widerspruch gegen Mahnbescheid',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An das Amtsgericht

Betreff: Widerspruch gegen Mahnbescheid

Sehr geehrte Damen und Herren,

gegen den Mahnbescheid vom {LETTER_DATE} lege ich hiermit fristgerecht Widerspruch ein.

(Bitte verwenden Sie das beiliegende Widerspruchsformular für das Gericht.)

Mit freundlichen Grüßen,

{USER_NAME}`
  },
  widerspruch_nebenkosten: {
    subject: 'Widerspruch gegen Nebenkostenabrechnung {YEAR}',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An {SENDER}

Betreff: Widerspruch gegen Nebenkostenabrechnung für den Zeitraum {YEAR}

Sehr geehrte Damen und Herren,

ich widerspreche der Nebenkostenabrechnung für den Zeitraum {YEAR} und weise die Nachforderung in Höhe von {AMOUNT} EUR zurück.

Begründung:
{USER_REASON}

Ich bitte um Übersendung aller Belege und Verträge, die der Abrechnung zugrunde liegen.

Mit freundlichen Grüßen,

{USER_NAME}`
  },
  kuendigung_vertrag: {
    subject: 'Kündigung meines Vertrages',
    body: `{USER_CITY}, den {TODAY_DATE}

{USER_NAME}
{USER_ADDRESS}
{USER_POSTAL_CODE} {USER_CITY}

An {SENDER}

Betreff: Kündigung meines Vertrages – Kundennummer {CONTRACT_NUMBER}

Sehr geehrte Damen und Herren,

hiermit kündige ich meinen Vertrag mit der Kundennummer {CONTRACT_NUMBER} fristgerecht zum nächstmöglichen Zeitpunkt.

Ich bitte um eine schriftliche Bestätigung der Kündigung.

Mit freundlichen Grüßen,

{USER_NAME}`
  },
}

const FIELD_LABELS: Record<string, string> = {
  USER_NAME: 'Your full name',
  USER_ADDRESS: 'Your street address',
  USER_POSTAL_CODE: 'Postal code',
  USER_CITY: 'City',
  SENDER: 'Sender name',
  LETTER_DATE: 'Letter date',
  TODAY_DATE: "Today's date",
  USER_REASON: 'Your reason / explanation',
  AMOUNT: 'Amount (€)',
  YEAR: 'Year of billing',
  CONTRACT_NUMBER: 'Contract / customer number',
  TAX_NUMBER: 'Tax number (Steuernummer)',
}

function extractFields(template: string): string[] {
  const matches = template.match(/\{([A-Z_]+)\}/g) ?? []
  return [...new Set(matches.map((m) => m.slice(1, -1)))]
}

function applyFields(template: string, values: Record<string, string>): string {
  return template.replace(/\{([A-Z_]+)\}/g, (_, key) => values[key] ?? `{${key}}`)
}

export default function ReplyEditor({ letter, onSaved, onCancel }: Props) {
  const templateId = letter.reply_template_id ?? 'einspruch_steuerbescheid'
  const tpl = TEMPLATES[templateId] ?? TEMPLATES['einspruch_steuerbescheid']

  const autoValues: Record<string, string> = {
    TODAY_DATE: new Date().toLocaleDateString('de-DE'),
    LETTER_DATE: letter.deadline
      ? new Date(letter.deadline).toLocaleDateString('de-DE')
      : new Date(letter.scanned_at).toLocaleDateString('de-DE'),
    SENDER: letter.sender ?? '',
    AMOUNT: letter.amount != null
      ? letter.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })
      : '',
    YEAR: String(new Date(letter.scanned_at).getFullYear() - 1),
  }

  const allFields = extractFields(tpl.body + tpl.subject)
  const manualFields = allFields.filter((f) => !['TODAY_DATE', 'LETTER_DATE'].includes(f))

  const [values, setValues] = useState<Record<string, string>>(() => ({ ...autoValues }))
  const [saving, setSaving] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [pdfSavedPath, setPdfSavedPath] = useState<string | null>(null)

  // AI mode
  const [hasApiKey, setHasApiKey] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiText, setAiText] = useState('')

  useEffect(() => {
    Promise.all([
      window.briefklar.getSetting('gemini_api_key'),
      window.briefklar.getSetting('user_name'),
      window.briefklar.getSetting('user_address'),
      window.briefklar.getSetting('user_postal_code'),
      window.briefklar.getSetting('user_city'),
    ]).then(([key, name, address, postal, city]) => {
      setHasApiKey(!!key)
      setValues((prev) => ({
        ...prev,
        ...(name ? { USER_NAME: name } : {}),
        ...(address ? { USER_ADDRESS: address } : {}),
        ...(postal ? { USER_POSTAL_CODE: postal } : {}),
        ...(city ? { USER_CITY: city } : {}),
      }))
    })
  }, [])

  const templatePreview = applyFields(tpl.body, { ...autoValues, ...values })
  const activeContent = aiMode && aiText ? aiText : templatePreview

  const handleAiGenerate = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiText('')
    try {
      const text = await window.briefklar.aiGenerateReply(letter.id)
      setAiText(text)
    } catch (e: any) {
      setAiError(e.message ?? 'AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    setPdfSavedPath(null)
    try {
      const path = await window.briefklar.exportPdf(activeContent, letter.id)
      if (path) setPdfSavedPath(path)
    } finally {
      setExportingPdf(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const reply = await window.briefklar.saveReply({
      id: uuidv4(),
      letter_id: letter.id,
      created_at: Date.now(),
      content: activeContent,
      template_id: aiMode ? 'ai_generated' : templateId
    })
    setSaving(false)
    onSaved(reply)
  }

  return (
    <div className="bg-white border border-surface-border rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Generate Reply</h3>
        {hasApiKey && (
          <div className="flex rounded-lg overflow-hidden border border-surface-border text-xs">
            <button
              type="button"
              onClick={() => setAiMode(false)}
              className={`px-3 py-1.5 transition-colors ${!aiMode ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Template
            </button>
            <button
              type="button"
              onClick={() => setAiMode(true)}
              className={`px-3 py-1.5 transition-colors ${aiMode ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ✨ AI Reply
            </button>
          </div>
        )}
      </div>

      {/* Template mode */}
      {!aiMode && (
        <div className="space-y-3 mb-5">
          {manualFields.map((field) => (
            <div key={field}>
              <label className="text-xs text-slate-500 mb-1 block">
                {FIELD_LABELS[field] ?? field}
              </label>
              {field === 'USER_REASON' ? (
                <textarea
                  rows={3}
                  value={values[field] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                  placeholder={`Enter ${FIELD_LABELS[field]?.toLowerCase() ?? field}…`}
                  aria-label={FIELD_LABELS[field] ?? field}
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[field] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                  placeholder={FIELD_LABELS[field] ?? field}
                  aria-label={FIELD_LABELS[field] ?? field}
                  className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI mode */}
      {aiMode && (
        <div className="mb-5">
          {!aiText && !aiLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-4">
                Gemini AI will write a formal German reply based on your letter's content.
              </p>
              <button
                type="button"
                onClick={handleAiGenerate}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                ✨ Generate with AI
              </button>
            </div>
          )}
          {aiLoading && (
            <div className="text-center py-8">
              <div className="text-3xl mb-3 animate-pulse">✨</div>
              <p className="text-sm text-slate-500">Generating reply…</p>
            </div>
          )}
          {aiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-3">
              {aiError}
            </div>
          )}
          {aiText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Generated</span>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  className="text-xs text-slate-400 hover:text-brand-600"
                >
                  Regenerate
                </button>
              </div>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={14}
                aria-label="AI generated reply text"
                className="w-full border border-surface-border rounded-xl p-3 text-sm text-slate-700 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              />
            </div>
          )}
        </div>
      )}

      {/* Preview (template mode only) */}
      {!aiMode && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Preview</div>
          <pre className="bg-slate-50 border border-surface-border rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-auto scrollbar-thin">
            {templatePreview}
          </pre>
        </div>
      )}

      <p className="text-xs text-slate-400 mb-4">
        Not legal advice. Review carefully before sending.
      </p>

      {/* PDF saved confirmation */}
      {pdfSavedPath && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 mb-3">
          ✓ PDF saved to: {pdfSavedPath}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-surface-border text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(activeContent)}
          className="flex-1 border border-brand-200 text-brand-600 text-sm py-2.5 rounded-xl hover:bg-brand-50"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exportingPdf || (aiMode && !aiText)}
          className="flex-1 border border-slate-200 text-slate-600 text-sm py-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-40"
        >
          {exportingPdf ? 'Exporting…' : '📄 PDF'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (aiMode && !aiText)}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl"
        >
          {saving ? 'Saving…' : 'Save Reply'}
        </button>
      </div>
    </div>
  )
}
