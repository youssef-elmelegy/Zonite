import styles from './CornerBlobs.module.css';

export interface CornerBlobsProps {
  /** 0 = hidden, 1 = visible */
  intensity?: 0 | 1;
}

export function CornerBlobs({ intensity = 1 }: CornerBlobsProps): JSX.Element | null {
  if (intensity === 0) return null;
  return (
    <div aria-hidden="true" className={styles.root}>
      <div className={styles.blobFire} />
      <div className={styles.blobMagenta} />
    </div>
  );
}
