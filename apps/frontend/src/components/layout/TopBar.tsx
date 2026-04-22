import { ReactNode } from 'react';
import styles from './TopBar.module.css';
import { ZoniteLogo } from '../common/icons';

export interface TopBarProps {
  /** Click handler for the logo / title (navigates home). */
  onHome?: () => void;
  /** Right-aligned content (PlayerChip, nav, action buttons). */
  right?: ReactNode;
}

/**
 * TopBar — page-chrome bar with Zonite logo + by-Yalgamers eyebrow on the left,
 * arbitrary right slot on the right. Clicking the logo calls `onHome`.
 */
export function TopBar({ onHome, right }: TopBarProps): JSX.Element {
  return (
    <header className={styles.root}>
      <button type="button" className={styles.brand} onClick={onHome} aria-label="Zonite home">
        <ZoniteLogo size={36} className={styles.logo} />
        <span className={styles.wordmark}>
          <span className={styles.title}>ZONITE</span>
          <span className={`eyebrow ${styles.eyebrow}`}>by Yalgamers</span>
        </span>
      </button>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  );
}
