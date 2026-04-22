import styles from './sections.module.css';

interface Swatch {
  name: string;
  role?: string;
}

const COLOR_TOKENS: Swatch[] = [
  { name: '--ink-900', role: 'page bg' },
  { name: '--ink-850', role: 'elevated' },
  { name: '--ink-800' },
  { name: '--ink-700', role: 'card' },
  { name: '--accent-yellow', role: 'CTA' },
  { name: '--accent-yellow-deep' },
  { name: '--accent-yellow-mustard' },
  { name: '--magenta-500' },
  { name: '--magenta-300' },
  { name: '--fire-red', role: 'danger' },
  { name: '--fire-pink', role: 'eyebrow' },
  { name: '--sky-300', role: 'info' },
  { name: '--cyan-400', role: 'LIVE' },
  { name: '--lime-500', role: 'success' },
  { name: '--orange-500', role: 'warn' },
  { name: '--team-red' },
  { name: '--team-blue' },
];

const RADII = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-pill',
];

const SPACING = ['--sp-1', '--sp-2', '--sp-3', '--sp-4', '--sp-5', '--sp-6', '--sp-8', '--sp-12'];

export function TokensSection(): JSX.Element {
  return (
    <section className={styles.section} aria-labelledby="sec-tokens">
      <h2 id="sec-tokens" className={styles.sectionTitle}>
        Tokens
      </h2>

      <h3 className={styles.subTitle}>Colors</h3>
      <div className={styles.grid}>
        {COLOR_TOKENS.map((t) => (
          <div key={t.name} className={styles.swatchCard}>
            <div
              className={styles.swatchChip}
              style={{ background: `var(${t.name})` }}
              aria-hidden="true"
            />
            <div className={styles.swatchMeta}>
              <code>{t.name}</code>
              {t.role && <span className={styles.dim}>{t.role}</span>}
            </div>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Typography</h3>
      <div className={styles.stack}>
        <h1 className="h1">Heading 1 — display</h1>
        <h2 className="h2">Heading 2 — primary</h2>
        <h3 className="h3">Heading 3 — secondary</h3>
        <p className="p">Body (Mulish Medium 12px). The quick brown fox jumps over the lazy dog.</p>
        <p className="eyebrow">Eyebrow — wide tracking</p>
        <p className="caption">Caption text</p>
      </div>

      <h3 className={styles.subTitle}>Radii</h3>
      <div className={styles.grid}>
        {RADII.map((r) => (
          <div key={r} className={styles.radiusCard} style={{ borderRadius: `var(${r})` }}>
            <code>{r}</code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Spacing</h3>
      <div className={styles.stack}>
        {SPACING.map((s) => (
          <div key={s} className={styles.spacingRow}>
            <span className={styles.spacingBar} style={{ width: `var(${s})` }} aria-hidden="true" />
            <code>{s}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
