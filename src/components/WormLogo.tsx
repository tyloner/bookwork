interface WormLogoProps {
  className?: string;
}

export function WormLogo({ className = "w-8 h-8" }: WormLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BookWrm logo"
    >
      {/* Open book */}
      <rect x="2" y="21" width="28" height="9" rx="2" fill="#4A5C44" />
      {/* Left page */}
      <path d="M3 21.5 L16 22.5 L16 29.5 L3 29.5 Z" fill="#EDE8DF" />
      {/* Right page */}
      <path d="M16 22.5 L29 21.5 L29 29.5 L16 29.5 Z" fill="#F5F0E8" />
      {/* Book spine */}
      <line x1="16" y1="21" x2="16" y2="30" stroke="#6B7D63" strokeWidth="1" />
      {/* Page lines left */}
      <line x1="5" y1="25" x2="14" y2="25.3" stroke="#C5BBAD" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="5" y1="27.5" x2="12" y2="27.7" stroke="#C5BBAD" strokeWidth="0.7" strokeLinecap="round" />
      {/* Page lines right */}
      <line x1="18" y1="25" x2="27" y2="24.7" stroke="#C5BBAD" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="18" y1="27.5" x2="25" y2="27.3" stroke="#C5BBAD" strokeWidth="0.7" strokeLinecap="round" />

      {/* Worm tail segment */}
      <circle cx="7" cy="19" r="3.5" fill="#5C8A60" />
      {/* Worm middle segment */}
      <circle cx="13" cy="14" r="4" fill="#6FA872" />
      {/* Worm head */}
      <circle cx="21" cy="9" r="5.5" fill="#7FC47F" />

      {/* Eyes */}
      <circle cx="19" cy="7.5" r="1.5" fill="white" />
      <circle cx="23" cy="7.5" r="1.5" fill="white" />
      <circle cx="19.4" cy="7.8" r="0.7" fill="#1A202C" />
      <circle cx="23.4" cy="7.8" r="0.7" fill="#1A202C" />

      {/* Smile */}
      <path d="M18.5 10.5 Q21 13 23.5 10.5" stroke="#2D5A2D" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}
