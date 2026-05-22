'use client';

export default function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="comp-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="comp-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon points="16,2.5 29.5,10.3 29.5,25.7 16,29.5 2.5,25.7 2.5,10.3" stroke="url(#comp-glow-grad)" strokeWidth="2" strokeLinejoin="round" opacity="0.8"/>
      <circle cx="16" cy="2.5" r="2" fill="#00f2fe" />
      <circle cx="29.5" cy="10.3" r="2" fill="#3b82f6" />
      <circle cx="29.5" cy="25.7" r="2" fill="#8b5cf6" />
      <circle cx="16" cy="29.5" r="2" fill="#8b5cf6" />
      <circle cx="2.5" cy="25.7" r="2" fill="#8b5cf6" />
      <circle cx="2.5" cy="10.3" r="2" fill="#3b82f6" />
      <path d="M18 5.5 L9 16.5 H15 L14 25.5 L23 14.5 H17 L18 5.5 Z" fill="url(#comp-logo-grad)"/>
    </svg>
  );
}
