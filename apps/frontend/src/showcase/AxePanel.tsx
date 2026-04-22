import { useEffect, useState } from 'react';

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  description: string;
  nodes: Array<{ target: string[]; html: string }>;
}

/**
 * Dev-only panel that runs axe-core against the document on mount and on
 * re-render, listing every WCAG 2.1 AA violation. Tree-shakes from
 * production because the whole showcase path is dev-only gated in main.tsx.
 */
export function AxePanel(): JSX.Element {
  const [violations, setViolations] = useState<AxeViolation[] | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function runAxe() {
      setRunning(true);
      try {
        const axe = (await import('axe-core')).default;
        const results = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        if (!cancelled) setViolations(results.violations as AxeViolation[]);
      } catch (err) {
        if (!cancelled)
          setViolations([
            {
              id: 'axe-core-load-failed',
              impact: 'critical',
              help: 'axe-core failed to load',
              description: String(err),
              nodes: [],
            },
          ]);
      } finally {
        if (!cancelled) setRunning(false);
      }
    }
    runAxe();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasViolations = violations && violations.length > 0;

  return (
    <div
      style={{
        border: `1px solid var(--${hasViolations ? 'fire-red' : 'border-default'})`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--bg-card)',
        color: 'var(--fg-primary)',
        fontSize: 'var(--fs-sm)',
        maxHeight: 260,
        overflowY: 'auto',
      }}
      aria-live="polite"
    >
      <strong style={{ color: hasViolations ? 'var(--fire-red)' : 'var(--lime-500)' }}>
        {running
          ? 'Running axe-core…'
          : hasViolations
            ? `${violations.length} a11y violation(s)`
            : 'Axe: 0 violations'}
      </strong>
      {hasViolations && (
        <ul style={{ margin: 'var(--sp-2) 0 0', paddingLeft: 'var(--sp-4)' }}>
          {violations!.map((v) => (
            <li key={v.id} style={{ marginBottom: 'var(--sp-1)' }}>
              <code>{v.id}</code> — {v.help} ({v.nodes.length} node{v.nodes.length === 1 ? '' : 's'}
              )
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
