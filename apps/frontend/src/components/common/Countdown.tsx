import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

export interface CountdownProps {
  /** Remaining seconds */
  seconds: number;
  /** Compact pill layout (single row with pulsing dot) */
  compact?: boolean;
  /** Threshold at or below which the timer enters warning state (seconds). Default 20. */
  warning?: number;
  /** Threshold at or below which the timer enters critical state (seconds). Default 10. */
  critical?: number;
  /** Fires when seconds reaches 0. */
  onComplete?: () => void;
}

type TimerState = 'normal' | 'warning' | 'critical';

function pickState(t: number, warning: number, critical: number): TimerState {
  if (t <= critical) return 'critical';
  if (t <= warning) return 'warning';
  return 'normal';
}

export function Countdown({
  seconds,
  compact = false,
  warning = 20,
  critical = 10,
  onComplete,
}: CountdownProps): JSX.Element {
  const [t, setT] = useState(seconds);

  useEffect(() => {
    setT(seconds);
  }, [seconds]);

  useEffect(() => {
    if (t <= 0) {
      onComplete?.();
      return;
    }
    const id = window.setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [t, onComplete]);

  const state = pickState(t, warning, critical);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');

  if (compact) {
    return (
      <div
        className={`${styles.compact} ${styles[`state${state.charAt(0).toUpperCase()}${state.slice(1)}`]} ${state === 'critical' ? 'timer-critical' : ''}`}
        data-state={state}
        role="timer"
        aria-live="polite"
        aria-label={`${t} seconds remaining`}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.digits}>
          {mm}:{ss}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} ${styles[`state${state.charAt(0).toUpperCase()}${state.slice(1)}`]} ${state === 'critical' ? 'timer-critical' : ''}`}
      data-state={state}
      role="timer"
      aria-live="polite"
      aria-label={`${t} seconds remaining`}
    >
      <div className={styles.tile}>
        <div className={styles.tileValue}>{mm}</div>
        <div className={styles.tileLabel}>MIN</div>
      </div>
      <div className={styles.tile}>
        <div className={styles.tileValue}>{ss}</div>
        <div className={styles.tileLabel}>SEC</div>
      </div>
    </div>
  );
}
