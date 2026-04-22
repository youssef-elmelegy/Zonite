import { useState } from 'react';
import styles from './sections.module.css';
import { Button } from '../../components/ui/Button';

const ANIMATIONS = [
  { name: 'claimPulse', durationMs: 400 },
  { name: 'cellPulse', durationMs: 2400 },
  { name: 'timerPulse', durationMs: 800 },
  { name: 'gridDrift', durationMs: 40_000 },
  { name: 'zpulse', durationMs: 1000 },
  { name: 'fadeUp', durationMs: 600 },
];

/**
 * Each row plays its keyframe on-demand by toggling inline-style animation
 * via the raw keyframe name (these are global keyframes declared in animations.css,
 * NOT scoped via CSS Modules).
 */
export function AnimationsSection(): JSX.Element {
  const [playing, setPlaying] = useState<Record<string, number>>({});

  const play = (name: string) => {
    setPlaying((p) => ({ ...p, [name]: (p[name] ?? 0) + 1 }));
  };

  return (
    <section className={styles.section} aria-labelledby="sec-animations">
      <h2 id="sec-animations" className={styles.sectionTitle}>
        Animations
      </h2>

      <p className={styles.caption}>
        All animations are wrapped in <code>@media (prefers-reduced-motion: no-preference)</code>
        and additionally guarded by <code>html[data-reduced-motion=&quot;true&quot;]</code>. Toggle
        the reduced-motion switch at the top of the page to verify they collapse.
      </p>

      <div className={styles.stack}>
        {ANIMATIONS.map(({ name, durationMs }) => (
          <div key={name} className={styles.animRow}>
            <code>{name}</code>
            <span className={styles.dim}>{durationMs}ms</span>
            <Button size="sm" variant="ghost" onClick={() => play(name)}>
              Play
            </Button>
            <div
              key={playing[name] ?? 0}
              className={styles.animTarget}
              style={{
                animationName: name,
                animationDuration: `${durationMs}ms`,
                animationTimingFunction: 'var(--ease-out)',
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
