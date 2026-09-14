/**
 * Brand marks are not part of the Lucide icon set, so the three we need are
 * defined here as inline SVG. They inherit `currentColor` and accept a size.
 */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
  focusable: 'false',
});

export function InstagramIcon({ size = 18, className }) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 18, className }) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.1c0-.8.2-1.4 1.4-1.4h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.5V21h3z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, className }) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.86.5 3.6 1.4 5.1L2 22l5.2-1.55a9.9 9.9 0 0 0 4.84 1.25h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm0 18.03a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.92.93-3.02-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.51 3.68-8.18 8.2-8.18 2.19 0 4.24.85 5.79 2.4a8.13 8.13 0 0 1 2.4 5.79c0 4.52-3.68 8.08-8.29 8.08Zm4.5-6.1c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.66.8-.81.97-.15.16-.3.18-.55.06a6.7 6.7 0 0 1-1.97-1.21 7.4 7.4 0 0 1-1.36-1.7c-.14-.25-.01-.39.11-.51.11-.12.25-.3.37-.45.12-.15.16-.25.25-.42.08-.16.04-.31-.03-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02 0 1.19.86 2.34.98 2.5.12.17 1.68 2.65 4.08 3.62 1.42.57 1.98.62 2.69.51.43-.06 1.35-.55 1.54-1.09.19-.53.19-.99.13-1.09-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
