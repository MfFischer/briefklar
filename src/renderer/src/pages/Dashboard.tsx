import type { Letter } from '../../../shared/types'
import type { Page } from '../App'

interface Props {
  letters: Letter[]
  onNavigate: (p: Page) => void
  onLettersChanged: () => void
}

const urgencyBorder: Record<string, string> = {
  critical: 'dash-letter-card-critical',
  high:     'dash-letter-card-high',
  medium:   'dash-letter-card-medium',
  low:      'dash-letter-card-low',
}

const urgencyBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
}

function daysUntil(ts: number | null): { label: string; urgent: boolean } | null {
  if (!ts) return null
  const diff = Math.ceil((ts - Date.now()) / 86_400_000)
  if (diff < 0)  return { label: 'Overdue',  urgent: true }
  if (diff === 0) return { label: 'Today',   urgent: true }
  if (diff === 1) return { label: 'Tomorrow', urgent: true }
  if (diff <= 7)  return { label: `${diff} days`, urgent: true }
  return { label: `${diff} days`, urgent: false }
}

export default function Dashboard({ letters, onNavigate }: Props) {
  const pending = letters.filter((l) => l.status === 'pending')
  const done    = letters.filter((l) => l.status === 'done')

  if (letters.length === 0) {
    return (
      <div className="dash-empty">
        <div className="dash-empty-icon">📭</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No letters scanned yet</h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          Click <span className="font-semibold text-teal-600">Scan Letter</span> in the sidebar,
          scan the QR code with your phone, and photograph any German official letter.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-0.5">Your Letters</h1>
        <p className="text-sm text-slate-400">
          {pending.length > 0
            ? `${pending.length} letter${pending.length > 1 ? 's' : ''} need${pending.length === 1 ? 's' : ''} attention`
            : 'All caught up — nothing pending'}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-8">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-pending">⏳</div>
          <div>
            <div className="text-2xl font-extrabold text-orange-500">{pending.length}</div>
            <div className="text-xs text-slate-400 font-medium">Pending</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-done">✅</div>
          <div>
            <div className="text-2xl font-extrabold text-green-500">{done.length}</div>
            <div className="text-xs text-slate-400 font-medium">Handled</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-total">📋</div>
          <div>
            <div className="text-2xl font-extrabold text-teal-600">{letters.length}</div>
            <div className="text-xs text-slate-400 font-medium">Total</div>
          </div>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Needs Attention</span>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="space-y-2">
            {pending.map((l) => <LetterCard key={l.id} letter={l} onNavigate={onNavigate} />)}
          </div>
        </section>
      )}

      {/* Done */}
      {done.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Handled</span>
            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">{done.length}</span>
          </div>
          <div className="space-y-2 opacity-75">
            {done.map((l) => <LetterCard key={l.id} letter={l} onNavigate={onNavigate} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function LetterCard({ letter, onNavigate }: { letter: Letter; onNavigate: (p: Page) => void }) {
  const deadline = daysUntil(letter.deadline)

  return (
    <button
      type="button"
      onClick={() => onNavigate({ name: 'letter', id: letter.id })}
      className={`dash-letter-card ${urgencyBorder[letter.urgency] ?? ''}`}
    >
      {/* Left: content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800 text-sm truncate">
            {letter.type_label ?? 'Unknown Letter'}
          </span>
          {letter.status === 'done' && (
            <span className="text-xs text-green-500 font-semibold shrink-0">✓ Done</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {letter.sender && (
            <span className="truncate max-w-[180px]">{letter.sender}</span>
          )}
          {letter.amount != null && (
            <span className="font-semibold text-slate-600">
              €{letter.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          )}
          {deadline && (
            <span className={`font-semibold ${deadline.urgent ? 'text-red-500' : 'text-slate-500'}`}>
              ⏰ {deadline.label}
            </span>
          )}
        </div>
      </div>

      {/* Right: badge + arrow */}
      <div className="shrink-0 flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyBadge[letter.urgency]}`}>
          {letter.urgency.charAt(0).toUpperCase() + letter.urgency.slice(1)}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  )
}
