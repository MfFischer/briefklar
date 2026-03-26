import { useState, useEffect } from 'react'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import LetterView from './pages/LetterView'
import SettingsPage from './pages/SettingsPage'
import OnboardingScreen from './components/OnboardingScreen'
import type { Letter } from '../../shared/types'

export type Page =
  | { name: 'dashboard' }
  | { name: 'letter'; id: string }
  | { name: 'settings' }

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' })
  const [letters, setLetters] = useState<Letter[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  const loadLetters = async () => {
    const data = await window.briefklar.getLetters()
    setLetters(data)
  }

  useEffect(() => {
    loadLetters()
    // Show onboarding on first launch
    window.briefklar.getSetting('onboarding_done').then((val) => {
      if (!val) setShowOnboarding(true)
    })
    // Handle notification click → open specific letter
    const cleanup = window.briefklar.onOpenLetter((id) => {
      setPage({ name: 'letter', id })
    })
    return cleanup
  }, [])

  const handleOnboardingDone = async () => {
    await window.briefklar.setSetting('onboarding_done', '1')
    setShowOnboarding(false)
  }

  const navigate = (p: Page) => setPage(p)

  return (
    <div className="flex h-full">
      {showOnboarding && <OnboardingScreen onDone={handleOnboardingDone} />}
      <Sidebar
        letters={letters}
        currentPage={page}
        onNavigate={navigate}
        onLettersChanged={loadLetters}
      />
      <main className="flex-1 overflow-auto">
        {page.name === 'dashboard' && (
          <Dashboard
            letters={letters}
            onNavigate={navigate}
            onLettersChanged={loadLetters}
          />
        )}
        {page.name === 'letter' && (
          <LetterView
            letterId={page.id}
            onBack={() => navigate({ name: 'dashboard' })}
            onLettersChanged={loadLetters}
          />
        )}
        {page.name === 'settings' && (
          <SettingsPage onShowWelcome={() => setShowOnboarding(true)} />
        )}
      </main>
    </div>
  )
}
