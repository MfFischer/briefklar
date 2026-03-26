import Logo from './Logo'

interface Props {
  onDone: () => void
}

const STEPS = [
  {
    icon: '📱',
    title: 'Take a photo',
    desc: 'Scan the QR code with your phone, then photograph your letter.',
    cardCls: 'ob-card-1',
    numCls: 'ob-num-1',
  },
  {
    icon: '🔍',
    title: 'We read it for you',
    desc: 'BriefKlar extracts the sender, deadline, amount, and meaning instantly.',
    cardCls: 'ob-card-2',
    numCls: 'ob-num-2',
  },
  {
    icon: '✅',
    title: 'Know what to do',
    desc: 'Get a plain summary, a deadline reminder, and a ready-to-send reply.',
    cardCls: 'ob-card-3',
    numCls: 'ob-num-3',
  },
]

export default function OnboardingScreen({ onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 ob-bg overflow-hidden flex items-center justify-center">

      {/* Floating ambient orbs */}
      <div className="ob-orb-a ob-orb-a-el" />
      <div className="ob-orb-b ob-orb-b-el" />
      <div className="ob-orb-c ob-orb-c-el" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-8 text-center">

        {/* Logo */}
        <div className="ob-logo flex justify-center mb-5">
          <div className="ob-logo-wrap">
            <Logo size={64} />
          </div>
        </div>

        {/* App name */}
        <h1 className="ob-title ob-app-name text-4xl font-extrabold tracking-tight mb-1">
          BriefKlar
        </h1>
        <p className="ob-sub ob-subtitle text-xs font-semibold tracking-widest uppercase mb-6">
          Klar · Schnell · Lokal
        </p>

        {/* Tagline */}
        <p className="ob-tagline text-slate-600 text-lg leading-relaxed mb-8 max-w-md mx-auto">
          Scan any German official letter.<br />
          <span className="font-bold text-slate-800">Understand it in seconds. Never miss a deadline.</span>
        </p>

        {/* Step cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {STEPS.map((step, i) => (
            <div key={i} className={`ob-card ${step.cardCls}`}>
              <div className={`absolute top-3 right-3 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${step.numCls}`}>
                {i + 1}
              </div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <div className="font-bold text-slate-800 text-sm mb-1">{step.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Privacy badge */}
        <div className="ob-privacy inline-flex items-center gap-2 bg-white/60 border border-white/80 rounded-full px-4 py-2 text-xs text-slate-500 mb-7 backdrop-blur-sm">
          <span className="text-green-500 font-bold">🔒</span>
          Everything stays on your computer · No cloud · No account · No tracking
        </div>

        {/* CTA */}
        <div className="ob-cta">
          <button
            type="button"
            onClick={onDone}
            className="ob-cta-btn ob-cta-inner relative inline-flex items-center gap-2 font-bold text-base px-10 py-3.5 rounded-2xl text-white transition-all hover:scale-105 active:scale-100"
          >
            Start Scanning
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}
