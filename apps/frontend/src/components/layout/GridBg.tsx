import styles from './GridBg.module.css';

export interface GridBgProps {
  /** Whether to show the decorative grid background */
  visible?: boolean;
}

export function GridBg({ visible = true }: GridBgProps): JSX.Element | null {
  if (!visible) return null;
  return <div aria-hidden="true" className={styles.root} />;
}
