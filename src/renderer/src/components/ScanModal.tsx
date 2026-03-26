import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { HandoffInfo, LetterAnalysis, ProcessedImage } from '../../../shared/types'

type Stage = 'qr' | 'processing' | 'review' | 'saving'

interface Props {
  onClose: () => void
  onLetterSaved: () => void
}

export default function ScanModal({ onClose, onLetterSaved }: Props) {
  const [stage, setStage] = useState<Stage>('qr')
  const [handoff, setHandoff] = useState<HandoffInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [analysis, setAnalysis] = useState<LetterAnalysis | null>(null)
  const [processed, setProcessed] = useState<ProcessedImage | null>(null)
  const [rawText, setRawText] = useState('')
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    startServer()
    return () => { cleanupRef.current?.(); window.briefklar.stopHandoffServer() }
  }, [])

  async function startServer() {
    try {
      const info = await window.briefklar.startHandoffServer()
      setHandoff(info)
      cleanupRef.current = window.briefklar.onPhotoReceived(handlePhotoReceived)
    } catch (e: any) {
      setError(e.message ?? 'Failed to start scan server')
    }
  }

  async function handlePhotoReceived(path: string) {
    setStage('processing')
    try {
      setProgress('Cleaning image…')
      await new Promise((r) => setTimeout(r, 300))
      setProgress('Running OCR (German)…')
      const result = await window.briefklar.processLetter(path)
      setProcessed(result.processed)
      setRawText(result.rawText)
      setAnalysis(result.analysis)
      setStage('review')
    } catch (e: any) {
      setError(e.message ?? 'Processing failed')
      setStage('qr')
    }
  }

  async function handleSave() {
    if (!analysis || !processed) return
    setStage('saving')
    try {
      await window.briefklar.saveLetter({
        id: uuidv4(),
        scanned_at: Date.now(),
        image_path: processed.processedPath,
        raw_text: rawText,
        letter_type: analysis.letterType,
        type_label: analysis.typeLabel,
        sender: analysis.sender,
        amount: analysis.amount,
        currency: analysis.currency,
        deadline: analysis.deadline ? new Date(analysis.deadline).getTime() : null,
        urgency: analysis.urgency,
        confidence: analysis.confidence,
        what_it_is: analysis.whatItIs,
        what_to_do: analysis.whatToDo,
        consequence: analysis.consequence,
        reply_template_id: analysis.replyTemplateId,
      })
      onLetterSaved()
    } catch (e: any) {
      setError(e.message)
      setStage('review')
    }
  }

  const urgencyColor: Record<string, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    low: 'text-green-700 bg-green-50 border-green-200',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="font-semibold text-slate-800">
            {stage === 'qr' && 'Scan Letter with Phone'}
            {stage === 'processing' && 'Processing…'}
            {stage === 'review' && 'Review Analysis'}
            {stage === 'saving' && 'Saving…'}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5">
          {/* QR stage */}
          {stage === 'qr' && (
            <div className="text-center">
              {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{error}</p>}
              {!handoff ? (
                <div className="py-12 text-slate-400 text-sm">Starting server…</div>
              ) : (
                <>
                  <p className="text-slate-600 text-sm mb-4">
                    Scan this QR code with your phone, then take a photo of the letter.
                    <br />
                    <span className="text-slate-400 text-xs">Phone and computer must be on the same WiFi.</span>
                  </p>
                  <div className="flex justify-center mb-4">
                    <img src={handoff.qrDataUrl} alt="QR code" className="rounded-xl border border-surface-border" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{handoff.url}</p>
                </>
              )}
            </div>
          )}

          {/* Processing stage */}
          {stage === 'processing' && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 animate-pulse">🔍</div>
              <p className="text-slate-600 font-medium">{progress}</p>
              <p className="text-slate-400 text-sm mt-1">This takes 10–30 seconds</p>
            </div>
          )}

          {/* Review stage */}
          {stage === 'review' && analysis && (
            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
              <div className={`rounded-xl border p-3 text-sm font-semibold ${urgencyColor[analysis.urgency]}`}>
                {analysis.urgency === 'critical' && '🚨 '}
                {analysis.urgency === 'high' && '⚠️ '}
                {analysis.urgency === 'medium' && '📋 '}
                {analysis.urgency === 'low' && '✅ '}
                {analysis.typeLabel}
                {analysis.confidence < 0.4 && (
                  <span className="text-xs font-normal ml-2 opacity-60">(low confidence)</span>
                )}
              </div>

              {/* Subject line — the most specific thing we can show */}
              {analysis.betreff && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">Subject</div>
                  <p className="text-sm font-medium text-teal-900">{analysis.betreff}</p>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">What this is</div>
                <p className="text-sm text-slate-700">{analysis.whatItIs}</p>
              </div>

              {(analysis.sender || analysis.amount || analysis.deadline || (analysis.referenceNumbers?.length > 0)) && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
                  {analysis.sender && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-16 shrink-0">From</span>
                      <span className="font-medium text-slate-800">{analysis.sender}</span>
                    </div>
                  )}
                  {analysis.amount != null && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-16 shrink-0">Amount</span>
                      <span className="font-semibold text-slate-800">
                        €{analysis.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {analysis.letterDate && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-16 shrink-0">Dated</span>
                      <span className="text-slate-600 text-sm">
                        {new Date(analysis.letterDate).toLocaleDateString('de-DE', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {analysis.deadline && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-16 shrink-0">Deadline</span>
                      <span className="font-semibold text-orange-600">
                        {new Date(analysis.deadline).toLocaleDateString('de-DE', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {analysis.letterDate && (
                          <span className="text-xs font-normal text-slate-400 ml-1">(§ 122 AO)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {analysis.referenceNumbers?.map((ref) => (
                    <div key={ref} className="flex gap-2">
                      <span className="text-slate-400 w-16 shrink-0 text-xs leading-5">Ref</span>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{ref}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">What to do</div>
                <ul className="space-y-1">
                  {analysis.whatToDo.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-brand-500 font-bold shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <span className="font-semibold">If ignored: </span>{analysis.consequence}
              </div>

              {analysis.freeHelp && analysis.freeHelp.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Free Help Available</div>
                  <ul className="space-y-1">
                    {analysis.freeHelp.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-blue-800">
                        <span className="shrink-0 text-blue-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {stage === 'saving' && (
            <div className="py-12 text-center text-slate-400 text-sm">Saving letter…</div>
          )}
        </div>

        {/* Footer actions */}
        {stage === 'review' && (
          <div className="px-6 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-surface-border text-slate-600 hover:bg-slate-50 text-sm font-medium"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
            >
              Save Letter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
