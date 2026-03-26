import { useState } from 'react'
import type { Page } from '../../App'
import type { Letter } from '../../../../shared/types'
import ScanModal from '../ScanModal'
import Logo from '../Logo'

interface Props {
  letters: Letter[]
  currentPage: Page
  onNavigate: (p: Page) => void
  onLettersChanged: () => void
}

const urgencyDot: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-yellow-400',
  low:      'bg-green-400',
}

export default function Sidebar({ letters, currentPage, onNavigate, onLettersChanged }: Props) {
  const [showScan, setShowScan] = useState(false)
  const pending = letters.filter((l) => l.status === 'pending')

  return (
    <>
      <aside className="sidebar w-60 flex flex-col h-full shrink-0">

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 drag-region flex items-center gap-2.5">
          <Logo size={30} />
          <div>
            <div className="sidebar-logo-name">BriefKlar</div>
            <div className="sidebar-logo-sub">German letters, made clear</div>
          </div>
        </div>

        {/* Scan button */}
        <div className="px-3 pb-4">
          <button type="button" onClick={() => setShowScan(true)} className="sidebar-scan-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Scan Letter
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-auto px-2 space-y-0.5">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'dashboard' })}
            className={`sidebar-nav-btn ${currentPage.name === 'dashboard' ? 'active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span className="flex-1">All Letters</span>
            {pending.length > 0 && (
              <span className="sidebar-badge">{pending.length}</span>
            )}
          </button>

          {letters.length > 0 && (
            <div className="sidebar-section-label">Recent</div>
          )}

          {letters.slice(0, 12).map((letter) => (
            <button
              key={letter.id}
              type="button"
              onClick={() => onNavigate({ name: 'letter', id: letter.id })}
              className={`sidebar-recent-btn ${currentPage.name === 'letter' && currentPage.id === letter.id ? 'active' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyDot[letter.urgency] ?? 'bg-slate-300'}`} />
              <span className="truncate flex-1">{letter.type_label ?? 'Unknown Letter'}</span>
              {letter.status === 'done' && <span className="text-teal-500 shrink-0">✓</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer px-2">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'settings' })}
            className={`sidebar-nav-btn ${currentPage.name === 'settings' ? 'active' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>
          <p className="sidebar-footer-note">🔒 Private · Local only</p>
        </div>
      </aside>

      {showScan && (
        <ScanModal
          onClose={() => setShowScan(false)}
          onLetterSaved={() => { setShowScan(false); onLettersChanged() }}
        />
      )}
    </>
  )
}
