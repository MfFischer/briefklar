interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document body */}
      <rect x="5" y="4" width="22" height="28" rx="3" fill="#14b8a6" opacity="0.12" />
      <rect x="5" y="4" width="22" height="28" rx="3" stroke="#0d9488" strokeWidth="2" />

      {/* Folded corner top-right */}
      <path d="M21 4 L27 10 H21 V4Z" fill="#14b8a6" opacity="0.25" stroke="#0d9488" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Text lines */}
      <line x1="10" y1="16" x2="22" y2="16" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="20" x2="22" y2="20" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <line x1="10" y1="24" x2="17" y2="24" stroke="#0d9488" strokeWidth="1.8" strokeLinecap="round" opacity="0.35" />

      {/* Magnifying glass */}
      <circle cx="28" cy="29" r="7" fill="white" />
      <circle cx="28" cy="29" r="5.5" stroke="#0d9488" strokeWidth="2" fill="#ccfbf1" />
      <line x1="32" y1="33" x2="36" y2="37" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />

      {/* Checkmark inside lens */}
      <path d="M25.5 29 L27.5 31 L31 27" stroke="#0f766e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
