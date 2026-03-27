import { useState, useEffect } from 'react'
import { LANGUAGES, setLanguage, getLanguage } from '../i18n'
import type { LangCode } from '../i18n'

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
