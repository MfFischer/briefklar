import { useState, useMemo } from 'react'
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

type FilterStatus = 'all' | 'pending' | 'done'
type FilterUrgency = 'all' | 'critical' | 'high' | 'medium' | 'low'

function daysUntil(ts: number | null): { label: string; urgent: boolean } | null {
  if (!ts) return null
  const diff = Math.ceil((ts - Date.now()) / 86_400_000)
  if (diff < 0)  return { label: 'Overdue',  urgent: true }
  if (diff === 0) return { label: 'Today',   urgent: true }
  if (diff === 1) return { label: 'Tomorrow', urgent: true }
  if (diff <= 7)  return { label: `${diff} days`, urgent: true }
  return { label: `${diff} days`, urgent: false }
}

function matchesSearch(letter: Letter, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return (
    (letter.type_label ?? '').toLowerCase().includes(lower) ||
    (letter.sender ?? '').toLowerCase().includes(lower) ||
    (letter.what_it_is ?? '').toLowerCase().includes(lower) ||
    (letter.raw_text ?? '').toLowerCase().includes(lower)
  )
}

export default function Dashboard({ letters, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<FilterUrgency>('all')

  const allPending = letters.filter((l) => l.status === 'pending')
  const allDone    = letters.filter((l) => l.status === 'done')

  const filtered = useMemo(() => {
    return letters.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (urgencyFilter !== 'all' && l.urgency !== urgencyFilter) return false
      if (!matchesSearch(l, query)) return false
      return true
    })
  }, [letters, query, statusFilter, urgencyFilter])

  const filteredPending = filtered.filter((l) => l.status === 'pending')
  const filteredDone    = filtered.filter((l) => l.status === 'done')

  const isFiltering = query || statusFilter !== 'all' || urgencyFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setUrgencyFilter('all')
  }

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
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-0.5">Your Letters</h1>
        <p className="text-sm text-slate-400">
          {allPending.length > 0
            ? `${allPending.length} letter${allPending.length > 1 ? 's' : ''} need${allPending.length === 1 ? 's' : ''} attention`
            : 'All caught up — nothing pending'}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-5">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-pending">⏳</div>
          <div>
            <div className="text-2xl font-extrabold text-orange-500">{allPending.length}</div>
            <div className="text-xs text-slate-400 font-medium">Pending</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon-done">✅</div>
          <div>
            <div className="text-2xl font-extrabold text-green-500">{allDone.length}</div>
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

      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 mb-6">
        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by sender, type, or content…"
            aria-label="Search letters"
            className="w-full pl-8 pr-8 py-2 text-sm border border-surface-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base leading-none"
              aria-label="Clear search"
            >✕</button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['all', 'pending', 'done'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-500 border-surface-border hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'All' : s === 'pending' ? '⏳ Pending' : '✅ Done'}
            </button>
          ))}
          <span className="text-xs text-slate-400 font-medium ml-2">Urgency:</span>
          {(['all', 'critical', 'high', 'medium', 'low'] as FilterUrgency[]).map((u) => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                urgencyFilter === u
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-500 border-surface-border hover:bg-slate-50'
              }`}
            >
              {u === 'all' ? 'All' : u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
          {isFiltering && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-slate-500 font-medium">No letters match your search</p>
          <button onClick={clearFilters} className="text-sm text-teal-600 hover:text-teal-700 mt-2 underline">Clear filters</button>
        </div>
      )}

      {/* Pending */}
      {filteredPending.length > 0 && (
        <section className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Needs Attention</span>
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{filteredPending.length}</span>
          </div>
          <div className="space-y-2">
            {filteredPending.map((l) => <LetterCard key={l.id} letter={l} onNavigate={onNavigate} />)}
          </div>
        </section>
      )}

      {/* Done */}
      {filteredDone.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Handled</span>
            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">{filteredDone.length}</span>
          </div>
          <div className="space-y-2 opacity-75">
            {filteredDone.map((l) => <LetterCard key={l.id} letter={l} onNavigate={onNavigate} />)}
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
