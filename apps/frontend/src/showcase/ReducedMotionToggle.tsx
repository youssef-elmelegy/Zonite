import { useEffect, useState } from 'react';

/**
 * Dev-only toggle that writes `data-reduced-motion="true"` to <html>.
 * Paired with the reduced-motion guard in `animations.css`.
 */
export function ReducedMotionToggle(): JSX.Element {
  const [reduced, setReduced] = useState(
    () => document.documentElement.dataset.reducedMotion === 'true',
  );

  useEffect(() => {
    if (reduced) {
      document.documentElement.dataset.reducedMotion = 'true';
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
  }, [reduced]);

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-2) var(--sp-3)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        color: 'var(--fg-primary)',
        fontSize: 'var(--fs-sm)',
        cursor: 'pointer',
      }}
    >
      <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
      Reduced motion
    </label>
  );
}
