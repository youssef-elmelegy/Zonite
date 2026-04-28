import { useMemo } from 'react';

export type GridPattern = 'split' | 'scatter' | 'key';

interface MiniGridArtProps {
  pattern?: GridPattern;
}

const N = 10;

function buildCells(pattern: GridPattern): string[] {
  return Array.from({ length: N * N }, (_, i) => {
    const c = i % N;
    if (pattern === 'split') {
      return c < N / 2
        ? Math.random() < 0.55
          ? 'blue'
          : 'empty'
        : Math.random() < 0.55
          ? 'red'
          : 'empty';
    }
    if (pattern === 'scatter') {
      return Math.random() < 0.14 ? 'red' : Math.random() < 0.3 ? 'blue' : 'empty';
    }
    if (pattern === 'key') {
      return i % 11 === 0 ? 'yellow' : Math.random() < 0.18 ? 'blue' : 'empty';
    }
    return 'empty';
  });
}

const COLOR: Record<string, string> = {
  red: 'var(--team-red)',
  blue: 'var(--team-blue)',
  yellow: 'var(--accent-yellow)',
  empty: 'rgba(255,255,255,0.05)',
};

export function MiniGridArt({ pattern = 'split' }: MiniGridArtProps): JSX.Element {
  const cells = useMemo(() => buildCells(pattern), [pattern]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        gap: 4,
        padding: 16,
        background: 'rgba(23,14,27,0.6)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 340,
      }}
      aria-hidden="true"
    >
      {cells.map((st, i) => {
        const color = COLOR[st] ?? COLOR.empty;
        return (
          <div
            key={i}
            style={{
              aspectRatio: '1',
              background: color,
              borderRadius: 4,
              boxShadow: st !== 'empty' ? `0 0 8px ${color}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
