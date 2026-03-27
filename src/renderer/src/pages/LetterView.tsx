import { useState, useEffect } from 'react'
import type { Letter, Reply, LetterTypeSummary } from '../../../shared/types'
import ReplyEditor from '../components/ReplyEditor'
import ReminderPicker from '../components/ReminderPicker'
import FeedbackButton from '../components/FeedbackButton'
import ShareSummary from '../components/ShareSummary'

interface Props {
  letterId: string
  onBack: () => void
  onLettersChanged: () => void
}

const urgencyColor: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  low: 'text-green-700 bg-green-50 border-green-200',
}

function confidencePill(confidence: number) {
  if (confidence >= 0.7) return { label: 'High confidence', cls: 'bg-green-100 text-green-700 border-green-200' }
  if (confidence >= 0.4) return { label: 'Medium confidence', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  return { label: 'Low confidence — verify manually', cls: 'bg-red-100 text-red-600 border-red-200' }
}

export default function LetterView({ letterId, onBack, onLettersChanged }: Props) {
  const [letter, setLetter] = useState<Letter | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [showReply, setShowReply] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [showRawText, setShowRawText] = useState(false)

  // Edit states
  const [editingOcr, setEditingOcr] = useState(false)
  const [ocrDraft, setOcrDraft] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineDraft, setDeadlineDraft] = useState('')

  const [editingType, setEditingType] = useState(false)
  const [letterTypes, setLetterTypes] = useState<LetterTypeSummary[]>([])

  // Calendar
  const [calendarQr, setCalendarQr] = useState<string | null>(null)
  const [calendarExporting, setCalendarExporting] = useState(false)
  const [exportingAnalysisPdf, setExportingAnalysisPdf] = useState(false)
  const [analysisPdfSaved, setAnalysisPdfSaved] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (calendarQr) {
        window.briefklar.stopCalendarServer().catch(() => {})
      }
    }
  }, [calendarQr])

  const load = async () => {
    const [l, r] = await Promise.all([
      window.briefklar.getLetter(letterId),
      window.briefklar.getReplies(letterId)
    ])
    setLetter(l)
    setReplies(r)
  }

  useEffect(() => { load() }, [letterId])

  const markDone = async () => {
    await window.briefklar.updateLetter(letterId, { status: 'done' })
    load(); onLettersChanged()
  }

  const markPending = async () => {
    await window.briefklar.updateLetter(letterId, { status: 'pending' })
    load(); onLettersChanged()
  }

  const handleDelete = async () => {
    const confirmed = await window.briefklar.showConfirmDialog(
      'Delete this letter permanently?',
      'This cannot be undone.'
    )
    if (!confirmed) return
    await window.briefklar.deleteLetter(letterId)
    onBack(); onLettersChanged()
  }

  // ── OCR editing ──────────────────────────────────────────────────────────────
  const startEditOcr = () => {
    setOcrDraft(letter?.raw_text ?? '')
    setEditingOcr(true)
    setShowRawText(true)
  }

  const saveOcr = async () => {
    await window.briefklar.updateLetter(letterId, { raw_text: ocrDraft })
    setEditingOcr(false)
    load()
  }

  const reanalyze = async () => {
    if (!letter) return
    setReanalyzing(true)
    try {
      const analysis = await window.briefklar.analyzeText(letter.raw_text)
      await window.briefklar.updateLetter(letterId, {
        letter_type: analysis.letterType,
        type_label: analysis.typeLabel,
        urgency: analysis.urgency,
        sender: analysis.sender ?? undefined,
        amount: analysis.amount ?? undefined,
        deadline: analysis.deadline ? new Date(analysis.deadline).getTime() : undefined,
        what_it_is: analysis.whatItIs,
        what_to_do: analysis.whatToDo,
        consequence: analysis.consequence,
        reply_template_id: analysis.replyTemplateId ?? undefined,
        confidence: analysis.confidence,
      } as any)
      load(); onLettersChanged()
    } finally {
      setReanalyzing(false)
    }
  }

  // ── Deadline editing ─────────────────────────────────────────────────────────
  const startEditDeadline = () => {
    const iso = letter?.deadline
      ? new Date(letter.deadline).toISOString().split('T')[0]
      : ''
    setDeadlineDraft(iso)
    setEditingDeadline(true)
  }

  const saveDeadline = async () => {
    const ts = deadlineDraft ? new Date(deadlineDraft).getTime() : null
    await window.briefklar.updateLetter(letterId, { deadline: ts } as any)
    setEditingDeadline(false)
    load()
  }

  // ── Type override ────────────────────────────────────────────────────────────
  const startEditType = async () => {
    if (letterTypes.length === 0) {
      const types = await window.briefklar.getLetterTypes()
      setLetterTypes(types)
    }
    setEditingType(true)
  }

  const changeType = async (typeId: string) => {
    const info = await window.briefklar.getLetterTypeInfo(typeId)
    if (!info) return
    await window.briefklar.updateLetter(letterId, {
      letter_type: info.id,
      type_label: info.label,
      urgency: info.urgency as any,
      what_it_is: info.whatItIs,
      what_to_do: info.whatToDo,
      consequence: info.consequence,
      reply_template_id: info.replyTemplateId,
    } as any)
    setEditingType(false)
    load(); onLettersChanged()
  }

  if (!letter) return <div className="p-6 text-slate-400">Loading…</div>

  const deadline = letter.deadline ? new Date(letter.deadline) : null
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
    : null

  const conf = confidencePill(letter.confidence ?? 0)

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
      >
        ← Back to all letters
      </button>

      {/* Type badge + confidence + feedback button */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full border ${urgencyColor[letter.urgency]}`}>
          {letter.urgency === 'critical' && '🚨'}
          {letter.urgency === 'high' && '⚠️'}
          {letter.urgency === 'medium' && '📋'}
          {letter.urgency === 'low' && '✅'}
          {letter.type_label ?? 'Unknown Letter'}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${conf.cls}`}>
          {conf.label}
        </span>
        <FeedbackButton letter={letter} onCorrected={() => { load(); onLettersChanged() }} />
      </div>

      {/* Type override dropdown */}
      {editingType && (
        <div className="bg-white border border-surface-border rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-slate-700 mb-3">Select the correct letter type:</p>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            {letterTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeType(t.id)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                  t.id === letter.letter_type
                    ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                    : 'border-surface-border text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.labelDe || t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditingType(false)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Low-confidence disclaimer */}
      {(letter.confidence ?? 0) < 0.4 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
          <strong>Verify before acting.</strong> OCR confidence is low — the letter type and extracted fields may be incorrect.
          Use the "Was this wrong?" button above to correct, or edit the raw text below to re-analyse.
        </div>
      )}

      {/* Extracted fields */}
      <div className="bg-white border border-surface-border rounded-2xl p-5 mb-4 space-y-3">
        {letter.sender && (
          <Row label="From" value={letter.sender} />
        )}
        {letter.amount != null && (
          <Row
            label="Amount"
            value={`€${letter.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`}
            valueClass="font-bold text-slate-800"
          />
        )}
        {/* Deadline with inline edit */}
        <div className="flex gap-3 text-sm items-center">
          <span className="text-slate-400 w-20 shrink-0">Deadline</span>
          {editingDeadline ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={deadlineDraft}
                onChange={(e) => setDeadlineDraft(e.target.value)}
                aria-label="Deadline date"
                className="border border-surface-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button onClick={saveDeadline} className="text-xs bg-brand-600 text-white px-3 py-1 rounded-lg">Save</button>
              <button onClick={() => setEditingDeadline(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className={
                deadline
                  ? (daysLeft !== null && daysLeft < 0 ? 'text-red-600 font-bold'
                    : daysLeft !== null && daysLeft <= 7 ? 'text-orange-600 font-semibold'
                    : 'text-slate-700')
                  : 'text-slate-400'
              }>
                {deadline
                  ? `${deadline.toLocaleDateString('en-DE', { day: 'numeric', month: 'long', year: 'numeric' })}${daysLeft !== null ? ` (${daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : `${daysLeft} days`})` : ''}`
                  : 'Not detected'}
              </span>
              <button
                onClick={startEditDeadline}
                className="text-xs text-slate-400 hover:text-brand-600 underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
        <Row
          label="Scanned"
          value={new Date(letter.scanned_at).toLocaleDateString('en-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
        <Row
          label="Status"
          value={letter.status === 'done' ? '✓ Handled' : letter.status === 'ignored' ? 'Ignored' : 'Pending'}
          valueClass={letter.status === 'done' ? 'text-green-600 font-semibold' : ''}
        />
        {letter.reminder_at && (
          <Row
            label="Reminder"
            value={new Date(letter.reminder_at).toLocaleString('de-DE')}
          />
        )}
      </div>

      {/* What it is */}
      {letter.what_it_is && (
        <section className="bg-white border border-surface-border rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">What this is</h3>
          <p className="text-slate-700 text-sm leading-relaxed">{letter.what_it_is}</p>
        </section>
      )}

      {/* What to do */}
      {letter.what_to_do?.length > 0 && (
        <section className="bg-white border border-surface-border rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What to do</h3>
          <ol className="space-y-2">
            {letter.what_to_do.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="bg-brand-100 text-brand-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Consequence */}
      {letter.consequence && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">If ignored</h3>
          <p className="text-amber-800 text-sm leading-relaxed">{letter.consequence}</p>
        </section>
      )}

      {/* Free Help */}
      {letter.free_help && letter.free_help.length > 0 && (
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Free Help Available</h3>
          <ul className="space-y-1.5">
            {letter.free_help.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-blue-800">
                <span className="text-blue-400 shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Share with Advisor */}
      <ShareSummary letter={letter} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {letter.status !== 'done' && (
          <button
            onClick={markDone}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            ✓ Mark as Handled
          </button>
        )}
        {letter.status === 'done' && (
          <button
            onClick={markPending}
            className="border border-surface-border text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            ↩ Mark as Pending
          </button>
        )}
        {letter.reply_template_id && (
          <button
            onClick={() => setShowReply(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            ✍️ Generate Reply
          </button>
        )}
        <button
          onClick={() => setShowReminder(!showReminder)}
          className="border border-surface-border text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          🔔 {letter.reminder_at ? 'Change Reminder' : 'Set Reminder'}
        </button>
        <button
          onClick={() => { setShowRawText(!showRawText); if (!showRawText) setEditingOcr(false) }}
          className="border border-surface-border text-slate-500 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          📄 {showRawText ? 'Hide' : 'Show'} Raw Text
        </button>
        <button
          onClick={async () => {
            setExportingAnalysisPdf(true)
            setAnalysisPdfSaved(null)
            try {
              const path = await window.briefklar.exportAnalysisPdf(letter.id)
              if (path) setAnalysisPdfSaved(path)
            } finally {
              setExportingAnalysisPdf(false)
            }
          }}
          disabled={exportingAnalysisPdf}
          className="border border-surface-border text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {exportingAnalysisPdf ? 'Exporting…' : '📄 Export PDF'}
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          🗑 Delete
        </button>
      </div>

      {/* Analysis PDF export confirmation */}
      {analysisPdfSaved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700 flex items-center justify-between">
          <span>✓ PDF saved: {analysisPdfSaved}</span>
          <button onClick={() => setAnalysisPdfSaved(null)} className="text-green-500 hover:text-green-700 ml-3">✕</button>
        </div>
      )}

      {/* Calendar export */}
      {letter.deadline && (
        <div className="bg-white border border-surface-border rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Add Deadline to Calendar
          </h3>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              disabled={calendarExporting}
              onClick={async () => {
                setCalendarExporting(true)
                await window.briefklar.exportCalendar(letter.id)
                setCalendarExporting(false)
              }}
              className="flex-1 border border-surface-border text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {calendarExporting ? 'Opening…' : '📅 Add to Calendar'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (calendarQr) { setCalendarQr(null); window.briefklar.stopCalendarServer(); return }
                const result = await window.briefklar.getCalendarQr(letter.id)
                if (result) setCalendarQr(result.qrDataUrl)
              }}
              className="flex-1 border border-surface-border text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 rounded-xl transition-colors"
            >
              {calendarQr ? '✕ Close QR' : '📲 Send to Phone'}
            </button>
          </div>
          {calendarQr && (
            <div className="text-center pt-2 border-t border-surface-border">
              <img src={calendarQr} alt="Calendar QR code" className="mx-auto rounded-xl mb-2" />
              <p className="text-xs text-slate-400">
                Scan with your phone → Calendar opens automatically
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reminder picker */}
      {showReminder && (
        <ReminderPicker
          letter={letter}
          onSaved={() => { setShowReminder(false); load(); onLettersChanged() }}
          onCancel={() => setShowReminder(false)}
        />
      )}

      {/* Reply editor */}
      {showReply && (
        <ReplyEditor
          letter={letter}
          onSaved={(reply) => { setReplies((r) => [reply, ...r]); setShowReply(false) }}
          onCancel={() => setShowReply(false)}
        />
      )}

      {/* Saved replies */}
      {replies.length > 0 && (
        <section className="mt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Saved Replies</h3>
          {replies.map((r) => (
            <div key={r.id} className="bg-white border border-surface-border rounded-2xl p-4 mb-3">
              <div className="text-xs text-slate-400 mb-2">
                {new Date(r.created_at).toLocaleDateString('de-DE')}
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(r.content)}
                className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Copy to clipboard
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Raw OCR text + edit */}
      {showRawText && (
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw OCR Text</h3>
            <div className="flex gap-2">
              {!editingOcr ? (
                <>
                  <button
                    onClick={startEditOcr}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={reanalyze}
                    disabled={reanalyzing}
                    className="text-xs text-slate-500 hover:text-brand-600 font-medium disabled:opacity-50"
                  >
                    {reanalyzing ? 'Re-analysing…' : '🔄 Re-analyse'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveOcr}
                    className="text-xs bg-brand-600 text-white px-3 py-1 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingOcr(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {editingOcr ? (
            <textarea
              value={ocrDraft}
              onChange={(e) => setOcrDraft(e.target.value)}
              rows={12}
              aria-label="OCR extracted text"
              className="w-full border border-brand-300 rounded-xl p-3 text-xs text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
            />
          ) : (
            <pre className="bg-slate-50 border border-surface-border rounded-xl p-4 text-xs text-slate-600 whitespace-pre-wrap overflow-auto max-h-64 scrollbar-thin font-mono">
              {letter.raw_text}
            </pre>
          )}
          {!editingOcr && (
            <p className="text-xs text-slate-400 mt-1">
              Edit the text to fix OCR errors, then click Re-analyse to update the extracted fields.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-slate-400 w-20 shrink-0">{label}</span>
      <span className={`text-slate-700 ${valueClass}`}>{value}</span>
    </div>
  )
}
