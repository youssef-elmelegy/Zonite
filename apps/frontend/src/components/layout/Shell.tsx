import { ReactNode } from 'react';
import styles from './Shell.module.css';
import { CornerBlobs } from './CornerBlobs';
import { GridBg } from './GridBg';
import { TopBar } from './TopBar';

export interface ShellProps {
  /** Main page content */
  children: ReactNode;
  /** Click handler for the TopBar logo (navigates home). */
  onHome?: () => void;
  /** Right-aligned TopBar content (PlayerChip, dev nav, etc.). */
  right?: ReactNode;
  /** 0 = blobs hidden, 1 = blobs visible. Default 1. */
  blobIntensity?: 0 | 1;
  /** Show drifting grid background. Default true. */
  showGrid?: boolean;
}

export function Shell({
  children,
  onHome,
  right,
  blobIntensity = 1,
  showGrid = true,
}: ShellProps): JSX.Element {
  return (
    <div className={styles.root}>
      <CornerBlobs intensity={blobIntensity} />
      <GridBg visible={showGrid} />
      <TopBar onHome={onHome} right={right} />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
