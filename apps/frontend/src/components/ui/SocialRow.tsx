const PROVIDERS = [
  { key: 'google', label: 'Google' },
  { key: 'discord', label: 'Discord' },
  { key: 'steam', label: 'Steam' },
] as const;

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.92h5.45c-.24 1.44-1.74 4.22-5.45 4.22-3.28 0-5.96-2.72-5.96-6.08S8.72 6.2 12 6.2c1.87 0 3.12.8 3.84 1.48l2.62-2.52C16.9 3.62 14.66 2.7 12 2.7 6.88 2.7 2.7 6.88 2.7 12S6.88 21.3 12 21.3c6.88 0 9.44-4.82 9.44-7.3 0-.48-.06-.9-.14-1.34H12z"
      />
    </svg>
  );
}

function DiscordGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
      <path d="M19.27 5.33C17.94 4.72 16.5 4.26 15 4c-.2.36-.43.85-.59 1.23-1.6-.24-3.19-.24-4.76 0-.17-.38-.4-.87-.6-1.23-1.51.26-2.95.72-4.28 1.33C1.07 9.33.29 13.22.68 17.06c1.8 1.34 3.54 2.15 5.26 2.69.43-.58.81-1.2 1.14-1.85-.63-.24-1.23-.53-1.8-.87.15-.11.3-.23.44-.35 3.46 1.62 7.2 1.62 10.63 0 .15.12.29.24.44.35-.57.34-1.17.63-1.8.87.33.65.71 1.27 1.14 1.85 1.72-.54 3.47-1.35 5.26-2.69.45-4.45-.79-8.3-3.32-11.73zM8.52 14.99c-1.03 0-1.88-.96-1.88-2.13s.83-2.13 1.88-2.13 1.9.96 1.88 2.13c0 1.17-.83 2.13-1.88 2.13zm6.96 0c-1.03 0-1.88-.96-1.88-2.13s.83-2.13 1.88-2.13 1.9.96 1.88 2.13c0 1.17-.83 2.13-1.88 2.13z" />
    </svg>
  );
}

function SteamGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)" />
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.8)" />
    </svg>
  );
}

const GLYPHS = {
  google: GoogleGlyph,
  discord: DiscordGlyph,
  steam: SteamGlyph,
} as const;

export function SocialRow() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}
    >
      {PROVIDERS.map((p) => {
        const Glyph = GLYPHS[p.key];
        return (
          <button
            key={p.key}
            type="button"
            disabled
            title={`${p.label} — coming soon`}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-secondary)',
              borderRadius: 8,
              padding: '11px 0',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-ui)',
              cursor: 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: 0.65,
              overflow: 'hidden',
            }}
          >
            <Glyph /> {p.label}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: -1,
                right: -1,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'var(--accent-yellow)',
                color: 'var(--ink-900)',
                padding: '2px 6px',
                borderBottomLeftRadius: 8,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Soon
            </span>
          </button>
        );
      })}
    </div>
  );
}
