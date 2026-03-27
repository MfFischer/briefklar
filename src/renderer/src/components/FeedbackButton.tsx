import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Letter, LetterTypeSummary } from '../../../shared/types'

interface Props {
  letter: Letter
  onCorrected: () => void
}

export default function FeedbackButton({ letter, onCorrected }: Props) {
  const [open, setOpen] = useState(false)
  const [letterTypes, setLetterTypes] = useState<LetterTypeSummary[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    if (letterTypes.length === 0) {
      const types = await window.briefklar.getLetterTypes()
      setLetterTypes(types)
    }
    setOpen(true)
  }

  const handleSelect = async (typeId: string) => {
    if (typeId === letter.letter_type) {
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      // Save feedback for learning
      await window.briefklar.saveFeedback({
        id: uuidv4(),
        letter_id: letter.id,
        original_type: letter.letter_type ?? 'unbekannt',
        corrected_type: typeId,
        raw_text_snippet: (letter.raw_text ?? '').substring(0, 500),
        created_at: Date.now(),
      })

      // Apply the correction to the letter
      const info = await window.briefklar.getLetterTypeInfo(typeId)
      if (info) {
        await window.briefklar.updateLetter(letter.id, {
          letter_type: info.id,
          type_label: info.label,
          urgency: info.urgency as any,
          what_it_is: info.whatItIs,
          what_to_do: info.whatToDo,
          consequence: info.consequence,
          reply_template_id: info.replyTemplateId,
        } as any)
      }

      setOpen(false)
      setSubmitted(true)
      onCorrected()
      setTimeout(() => setSubmitted(false), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
        <span>✓</span>
        <span>Thanks! Your feedback helps improve BriefKlar.</span>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-full px-3 py-1.5 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Was this wrong?
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-surface-border rounded-2xl shadow-lg p-4 w-72 max-h-80 overflow-y-auto">
          <p className="text-sm font-medium text-slate-700 mb-2">
            What type of letter is this actually?
          </p>
          <p className="text-xs text-slate-400 mb-3">
            Your correction helps BriefKlar classify better.
          </p>
          {loading ? (
            <div className="text-center py-4 text-slate-400 text-sm">Saving…</div>
          ) : (
            <div className="space-y-1">
              {letterTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelect(type.id)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                    type.id === letter.letter_type
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-surface-border'
                  }`}
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-slate-400 ml-1.5">({type.labelDe})</span>
                  {type.id === letter.letter_type && (
                    <span className="text-brand-500 ml-1">← current</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 w-full text-center"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
