import styles from './Showcase.module.css';
import { ReducedMotionToggle } from './ReducedMotionToggle';
import { AxePanel } from './AxePanel';
import { TokensSection } from './sections/TokensSection';
import { LayoutSection } from './sections/LayoutSection';
import { UISection } from './sections/UISection';
import { CommonSection } from './sections/CommonSection';
import { GameSection } from './sections/GameSection';
import { AnimationsSection } from './sections/AnimationsSection';

/**
 * /_showcase — dev-only route that renders every Phase 1 primitive in every
 * documented state. Tree-shakes from production because main.tsx only
 * imports this path behind `import.meta.env.DEV && pathname === '/_showcase'`.
 *
 * See specs/003-design-handoff/contracts/primitives.contract.md § Showcase contract.
 */
export function Showcase(): JSX.Element {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1 className={styles.title}>Zonite Showcase</h1>
          <span className={styles.subtitle}>
            /_showcase (dev-only) — axe-core, reduced-motion toggle, every primitive
          </span>
        </div>
        <div className={styles.controls}>
          <ReducedMotionToggle />
          <AxePanel />
        </div>
        <nav className={styles.toc} aria-label="Sections">
          <a href="#sec-tokens">Tokens</a>
          <a href="#sec-layout">Layout</a>
          <a href="#sec-ui">UI</a>
          <a href="#sec-common">Common</a>
          <a href="#sec-game">Game</a>
          <a href="#sec-animations">Animations</a>
        </nav>
      </header>

      <main>
        <TokensSection />
        <LayoutSection />
        <UISection />
        <CommonSection />
        <GameSection />
        <AnimationsSection />
      </main>
    </div>
  );
}
