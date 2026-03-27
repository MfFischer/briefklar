import { useState, useEffect } from 'react'
import { LANGUAGES, setLanguage, getLanguage } from '../i18n'
import type { LangCode } from '../i18n'

// ── Types ─────────────────────────────────────────────────────────────────────
interface FeedbackStats {
  totalCorrections: number
  topMisclassified: Array<{ original: string; corrected: string; count: number }>
}

interface FeatureVote {
  id: string
  label: string
  description: string
  votes: number
  userVoted: boolean
}

const FEATURE_IDEAS: Omit<FeatureVote, 'votes' | 'userVoted'>[] = [
  { id: 'reply_library',   label: 'Reply template library',      description: 'More Einspruch, Widerspruch & Kündigung templates' },
  { id: 'calendar_win',   label: 'Windows Calendar integration',  description: 'Add deadlines directly to Windows Calendar app' },
  { id: 'ocr_improve',    label: 'Better OCR accuracy',           description: 'Handles blurry / dark / skewed photos better' },
  { id: 'more_types',     label: 'More letter types',             description: 'Expand from 26 → 40+ recognised German letter types' },
  { id: 'mobile_app',     label: 'Companion phone app',           description: 'Scan from phone even when PC is offline' },
  { id: 'auto_remind',    label: 'Smarter reminders',             description: 'Auto-suggest reminder based on deadline urgency' },
]

// ── Insights panel ────────────────────────────────────────────────────────────
function InsightsPanel() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    window.briefklar.getFeedbackStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    const data = await window.briefklar.exportFeedback()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `briefklar-feedback-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="text-xs text-slate-400 py-3 text-center">Loading insights…</div>
  )

  if (!stats) return null

  const hasMisclassifications = stats.topMisclassified.length > 0

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-surface-border">
          <div className="text-2xl font-bold text-teal-700">{stats.totalCorrections}</div>
          <div className="text-xs text-slate-400 mt-0.5">corrections submitted</div>
        </div>
        <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-surface-border">
          <div className="text-2xl font-bold text-teal-700">{stats.topMisclassified.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">unique confusion pairs</div>
        </div>
      </div>

      {/* No data state */}
      {!hasMisclassifications && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <p className="font-semibold mb-1">🎉 No misclassifications yet</p>
          <p className="text-xs text-green-600">When users correct a wrong letter type, the pattern appears here. Keep scanning!</p>
        </div>
      )}

      {/* Misclassification table */}
      {hasMisclassifications && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Most corrected</span>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-teal-600 hover:text-teal-700"
            >
              {expanded ? 'Show less' : 'Show all'}
            </button>
          </div>
          <div className="space-y-1.5">
            {(expanded ? stats.topMisclassified : stats.topMisclassified.slice(0, 5)).map((row, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2 border border-surface-border">
                <span className="font-mono text-red-500 shrink-0 w-5 text-center font-bold">{row.count}×</span>
                <span className="text-slate-500 truncate flex-1" title={row.original}>{row.original}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <span className="text-teal-700 font-medium truncate flex-1" title={row.corrected}>{row.corrected}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export button */}
      {hasMisclassifications && (
        <button
          type="button"
          onClick={handleExport}
          className="mt-4 w-full border border-surface-border text-slate-500 hover:bg-slate-50 text-xs font-medium py-2 rounded-xl transition-colors"
        >
          ↓ Export feedback JSON (for pattern tuning)
        </button>
      )}

      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
        Each correction is stored locally. Export to JSON to manually tune
        the pattern-matcher weights in <code className="bg-slate-100 px-1 rounded">letters.json</code>.
      </p>
    </div>
  )
}

// ── Feature voting panel ──────────────────────────────────────────────────────
function FeatureVotePanel() {
  const [features, setFeatures] = useState<FeatureVote[]>(() =>
    FEATURE_IDEAS.map(f => ({ ...f, votes: 0, userVoted: false }))
  )
  const [loaded, setLoaded] = useState(false)
  const [thankYou, setThankYou] = useState<string | null>(null)

  useEffect(() => {
    // Load votes + user votes from settings
    Promise.all(
      FEATURE_IDEAS.map(async (f) => {
        const votes = await window.briefklar.getSetting(`vote_count_${f.id}`)
        const voted = await window.briefklar.getSetting(`vote_cast_${f.id}`)
        return {
          ...f,
          votes: votes ? parseInt(votes, 10) : 0,
          userVoted: voted === '1',
        }
      })
    ).then(updated => {
      setFeatures(updated)
      setLoaded(true)
    })
  }, [])

  const handleVote = async (id: string) => {
    const feat = features.find(f => f.id === id)
    if (!feat || feat.userVoted) return

    const newVotes = feat.votes + 1
    await window.briefklar.setSetting(`vote_count_${id}`, String(newVotes))
    await window.briefklar.setSetting(`vote_cast_${id}`, '1')

    setFeatures(prev => prev.map(f =>
      f.id === id ? { ...f, votes: newVotes, userVoted: true } : f
    ))
    setThankYou(id)
    setTimeout(() => setThankYou(null), 3000)
  }

  const sorted = [...features].sort((a, b) => b.votes - a.votes)
  const maxVotes = Math.max(1, ...sorted.map(f => f.votes))

  if (!loaded) return <div className="text-xs text-slate-400 py-3 text-center">Loading…</div>

  return (
    <div className="space-y-2">
      {thankYou && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-700 mb-3">
          ✓ Vote recorded! This helps prioritise what gets built next.
        </div>
      )}
      {sorted.map((feat) => {
        const barWidth = feat.votes > 0 ? Math.round((feat.votes / maxVotes) * 100) : 0
        return (
          <div
            key={feat.id}
            className={`relative bg-white border rounded-xl p-3 overflow-hidden transition-all ${
              feat.userVoted
                ? 'border-teal-300 bg-teal-50/30'
                : 'border-surface-border hover:border-teal-200 cursor-pointer'
            }`}
            onClick={() => !feat.userVoted && handleVote(feat.id)}
          >
            {/* Vote bar background */}
            {feat.votes > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-teal-50 transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            )}
            <div className="relative flex items-center gap-3">
              {/* Vote button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleVote(feat.id) }}
                disabled={feat.userVoted}
                className={`flex flex-col items-center w-10 shrink-0 rounded-lg py-1 transition-colors ${
                  feat.userVoted
                    ? 'text-teal-600 bg-teal-100'
                    : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={feat.userVoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                <span className="text-xs font-bold leading-none mt-0.5">{feat.votes}</span>
              </button>
              {/* Feature info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{feat.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{feat.description}</div>
              </div>
              {feat.userVoted && (
                <span className="text-xs text-teal-600 font-semibold shrink-0">✓ Voted</span>
              )}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-slate-400 pt-2 leading-relaxed">
        Votes are stored locally. They help you understand what your users want most when planning v2 features.
      </p>
    </div>
  )
}

export default function SettingsPage({ onShowWelcome }: { onShowWelcome?: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const [saving, setSaving] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)

  // User profile
  const [userName, setUserName] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [userPostal, setUserPostal] = useState('')
  const [userCity, setUserCity] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  // Language
  const [lang, setLang] = useState<LangCode>(getLanguage())

  useEffect(() => {
    window.briefklar.getSetting('gemini_api_key').then((k) => {
      if (k) { setSavedKey(k); setApiKey(k) }
    })
    window.briefklar.getSetting('ui_language').then((l) => {
      if (l) { setLang(l as LangCode); setLanguage(l as LangCode) }
    })
    Promise.all([
      window.briefklar.getSetting('user_name'),
      window.briefklar.getSetting('user_address'),
      window.briefklar.getSetting('user_postal_code'),
      window.briefklar.getSetting('user_city'),
    ]).then(([name, address, postal, city]) => {
      if (name) setUserName(name)
      if (address) setUserAddress(address)
      if (postal) setUserPostal(postal)
      if (city) setUserCity(city)
    })
  }, [])

  const handleLangChange = async (code: LangCode) => {
    setLang(code)
    setLanguage(code)
    await window.briefklar.setSetting('ui_language', code)
  }

  const handleSaveProfile = async () => {
    await Promise.all([
      window.briefklar.setSetting('user_name', userName),
      window.briefklar.setSetting('user_address', userAddress),
      window.briefklar.setSetting('user_postal_code', userPostal),
      window.briefklar.setSetting('user_city', userCity),
    ])
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const handleTestAndSave = async () => {
    if (!apiKey.trim()) return
    setTesting(true)
    setTestResult(null)
    const ok = await window.briefklar.testApiKey(apiKey.trim())
    setTesting(false)
    setTestResult(ok ? 'ok' : 'fail')
    if (ok) {
      setSaving(true)
      await window.briefklar.setSetting('gemini_api_key', apiKey.trim())
      setSavedKey(apiKey.trim())
      setSaving(false)
    }
  }

  const handleRemoveKey = async () => {
    await window.briefklar.setSetting('gemini_api_key', '')
    setSavedKey('')
    setApiKey('')
    setTestResult(null)
  }

  const handleExportBackup = async () => {
    setBackupMsg(null)
    const ok = await window.briefklar.exportBackup()
    setBackupMsg(ok ? '✓ Backup saved successfully.' : 'Backup cancelled.')
  }

  const handleImportBackup = async () => {
    const confirmed = await window.briefklar.showConfirmDialog(
      'Restore backup?',
      'This will replace all current data and restart the app. This cannot be undone.'
    )
    if (!confirmed) return
    setBackupMsg(null)
    await window.briefklar.importBackup()
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Settings</h1>
      <p className="text-sm text-slate-400 mb-8">All data is stored locally on your computer.</p>

      {/* ── Language ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">🌍 Language</h2>
        <p className="text-sm text-slate-500 mb-4">
          Choose your preferred language for the BriefKlar interface.
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLangChange(l.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                lang === l.code
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-surface-border hover:bg-slate-50'
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </section>

      {/* ── Your Profile ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">Your Profile</h2>
        <p className="text-sm text-slate-500 mb-4">
          Auto-fills your details in reply letters so you don't retype them every time.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Full name (e.g. Max Mustermann)"
            aria-label="Full name"
            className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="Street address (e.g. Musterstraße 12)"
            aria-label="Street address"
            className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={userPostal}
              onChange={(e) => setUserPostal(e.target.value)}
              placeholder="Postal code"
              aria-label="Postal code"
              className="w-28 border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              value={userCity}
              onChange={(e) => setUserCity(e.target.value)}
              placeholder="City (e.g. Berlin)"
              aria-label="City"
              className="flex-1 border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Save Profile
          </button>
          {profileSaved && <span className="text-xs text-green-600">✓ Saved</span>}
        </div>
      </section>

      {/* ── AI Reply (BYOK Gemini) ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">✨ AI Reply Generation</h2>
        <p className="text-sm text-slate-500 mb-4">
          Optional. Add a free Gemini API key to unlock AI-generated German reply letters.
          The app works fully without this — built-in reply templates are always available.
        </p>

        {/* Guide */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-sm text-brand-800 mb-4 space-y-1">
          <p className="font-medium">How to get a free Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-brand-700 text-xs">
            <li>Go to <strong>aistudio.google.com</strong></li>
            <li>Sign in with your Google account</li>
            <li>Click <strong>"Get API key"</strong> → <strong>"Create API key"</strong></li>
            <li>Copy and paste it below</li>
          </ol>
          <p className="text-xs text-brand-600 mt-1">Free tier: 15 requests/minute · No credit card needed</p>
        </div>

        {savedKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 mb-3 flex items-center justify-between">
            <span>✓ API key configured</span>
            <button
              type="button"
              onClick={handleRemoveKey}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
            placeholder="AIza…"
            aria-label="Gemini API key"
            className="flex-1 border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={testing || saving || !apiKey.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap"
          >
            {testing ? 'Testing…' : saving ? 'Saving…' : 'Test & Save'}
          </button>
        </div>

        {testResult === 'ok' && (
          <p className="text-xs text-green-600 mt-2">✓ Key is valid and saved.</p>
        )}
        {testResult === 'fail' && (
          <p className="text-xs text-red-600 mt-2">
            Invalid key or no internet. Check the key and try again.
          </p>
        )}
      </section>

      {/* ── Backup & Restore ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">💾 Backup & Restore</h2>
        <p className="text-sm text-slate-500 mb-4">
          Export all letters and scanned images as a ZIP file you can store safely.
          Restore replaces all data and restarts the app.
        </p>

        {backupMsg && (
          <div className="bg-slate-50 border border-surface-border rounded-xl p-3 text-sm text-slate-600 mb-3">
            {backupMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex-1 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            ↓ Export Backup
          </button>
          <button
            type="button"
            onClick={handleImportBackup}
            className="flex-1 border border-surface-border text-slate-600 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            ↑ Restore Backup
          </button>
        </div>
      </section>

      {/* ── Classification Insights ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">📊 Classification Insights</h2>
        <p className="text-sm text-slate-500 mb-4">
          See where the letter classifier gets it wrong. Every correction you submit via “Was this wrong?” appears here.
          Export the data to improve the pattern-matcher for future versions.
        </p>
        <InsightsPanel />
      </section>

      {/* ── What should we build next? ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-1">💡 What should we build next?</h2>
        <p className="text-sm text-slate-500 mb-4">
          Vote for the features you want most in the next version of BriefKlar.
          One vote per feature — votes are saved on your device.
        </p>
        <FeatureVotePanel />
      </section>

      {/* ── About ── */}
      <section className="bg-white border border-surface-border rounded-2xl p-5">
        <h2 className="font-semibold text-slate-800 mb-3">About BriefKlar</h2>
        <div className="space-y-1.5 text-sm text-slate-500 mb-4">
          <p>Version 0.2.0</p>
          <p>All data is stored locally · No cloud · No tracking</p>
          <p className="text-xs text-slate-400 pt-1">
            BriefKlar uses OCR + fuzzy pattern matching to analyse letters.
            It is not a legal service. Always verify important deadlines independently.
          </p>
        </div>
        {onShowWelcome && (
          <button
            type="button"
            onClick={onShowWelcome}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
          >
            View welcome screen again
          </button>
        )}
      </section>
    </div>
  )
}
