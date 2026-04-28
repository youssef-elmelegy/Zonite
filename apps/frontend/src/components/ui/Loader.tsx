import { useEffect, useMemo, useState } from 'react';

// ── ClaimGrid ────────────────────────────────────────────────────────────────
interface ClaimGridProps {
  size?: number;
  cell?: number;
  gap?: number;
  palette?: 'fire' | 'team' | 'magenta';
}

export function ClaimGrid({
  size = 4,
  cell = 18,
  gap = 4,
  palette = 'fire',
}: ClaimGridProps): JSX.Element {
  const N = size * size;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, []);

  // Spiral fill order — clockwise from top-left
  const order = useMemo(() => {
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(-1) as number[]);
    let r = 0,
      c = 0,
      dr = 0,
      dc = 1;
    for (let i = 0; i < N; i++) {
      grid[r][c] = i;
      const nr = r + dr,
        nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || grid[nr][nc] !== -1) {
        if (dc === 1) {
          dr = 1;
          dc = 0;
        } else if (dr === 1) {
          dr = 0;
          dc = -1;
        } else if (dc === -1) {
          dr = -1;
          dc = 0;
        } else {
          dr = 0;
          dc = 1;
        }
      }
      r += dr;
      c += dc;
    }
    const flat: number[] = [];
    for (let rr = 0; rr < size; rr++) for (let cc = 0; cc < size; cc++) flat.push(grid[rr][cc]);
    return flat;
  }, [size, N]);

  const palettes: Record<string, [string, string, string]> = {
    fire: ['var(--accent-yellow)', 'var(--orange-500)', 'var(--fire-red)'],
    team: ['var(--team-blue)', 'var(--team-blue)', 'var(--team-red)'],
    magenta: ['var(--magenta-500)', 'var(--fire-pink)', 'var(--accent-yellow)'],
  };
  const colors = palettes[palette] ?? palettes.fire;
  const phase = tick % (N * 2);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cell}px)`,
        gap,
        padding: gap * 2,
        background: 'rgba(23,14,27,0.6)',
        border: '1px solid var(--border-default)',
        borderRadius: 10,
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {Array.from({ length: N }).map((_, i) => {
        const slot = order[i];
        const filling = phase < N;
        const filled = filling ? slot < phase : slot >= phase - N;
        const dist = filling ? phase - slot - 1 : N + slot - (phase - N);
        const colorIdx = Math.min(2, Math.max(0, Math.floor(dist / Math.max(1, N / 3))));
        const color = colors[colorIdx];
        return (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              borderRadius: 4,
              background: filled ? color : 'rgba(255,255,255,0.05)',
              boxShadow: filled
                ? `0 0 8px ${color}, inset 0 0 0 1px rgba(255,255,255,0.18)`
                : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
              transition: 'background 160ms var(--ease-out), box-shadow 160ms var(--ease-out)',
            }}
          />
        );
      })}
    </div>
  );
}

// ── MiniSpinner ───────────────────────────────────────────────────────────────
export function MiniSpinner({ size = 28 }: { size?: number }): JSX.Element {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: 'var(--accent-yellow)',
        borderRightColor: 'var(--fire-red)',
        animation: 'zspin 900ms linear infinite',
        boxShadow: '0 0 12px rgba(253,235,86,0.3)',
      }}
    />
  );
}

// ── LoadingDots ───────────────────────────────────────────────────────────────
export function LoadingDots({ color = 'var(--accent-yellow)' }: { color?: string }): JSX.Element {
  return (
    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 6, verticalAlign: 'middle' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: color,
            animation: `zpulse 1100ms ease-in-out ${i * 180}ms infinite`,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </span>
  );
}

// ── FullScreen ────────────────────────────────────────────────────────────────
interface FullScreenProps {
  label?: string;
  hint?: string;
  palette?: 'fire' | 'team' | 'magenta';
  code?: string;
  onCancel?: () => void;
}

function FullScreen({
  label = 'Loading',
  hint,
  palette = 'fire',
  code,
  onCancel,
}: FullScreenProps): JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'radial-gradient(ellipse at center, rgba(39,29,39,0.95) 0%, rgba(16,6,19,0.98) 70%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -100,
          top: -100,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'var(--grad-fire)',
          filter: 'blur(50px)',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -140,
          bottom: -140,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'var(--magenta-500)',
          filter: 'blur(70px)',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          padding: 40,
          maxWidth: 480,
          textAlign: 'center',
        }}
      >
        <ClaimGrid size={4} cell={20} gap={5} palette={palette} />

        <div>
          <div
            className="eyebrow"
            style={{ color: 'var(--fire-pink)', marginBottom: 10, letterSpacing: '0.22em' }}
          >
            {/* In Progress */}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {label}
            <LoadingDots />
          </div>
          {hint && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: 'var(--fg-tertiary)',
                lineHeight: 1.5,
                maxWidth: 360,
              }}
            >
              {hint}
            </div>
          )}
          {code && (
            <div
              style={{
                marginTop: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(253,235,86,0.08)',
                border: '1px solid rgba(253,235,86,0.4)',
                borderRadius: 100,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--fg-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                }}
              >
                Room
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  color: 'var(--accent-yellow)',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                }}
              >
                {code}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            width: 280,
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 100,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background:
                'linear-gradient(90deg, transparent, var(--accent-yellow), var(--fire-red), transparent)',
              animation: 'zsweep 1400ms ease-in-out infinite',
              boxShadow: '0 0 12px rgba(253,235,86,0.4)',
            }}
          />
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-tertiary)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '8px 16px',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inline ────────────────────────────────────────────────────────────────────
type InlineSize = 'sm' | 'md' | 'lg';
interface InlineProps {
  size?: InlineSize;
  label?: string;
  color?: string;
}

function Inline({ size = 'md', label, color = 'var(--accent-yellow)' }: InlineProps): JSX.Element {
  const sizeMap: Record<InlineSize, { s: number; fs: number }> = {
    sm: { s: 18, fs: 11 },
    md: { s: 28, fs: 13 },
    lg: { s: 42, fs: 15 },
  };
  const { s, fs } = sizeMap[size];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <MiniSpinner size={s} />
      {label && (
        <span style={{ fontSize: fs, color: 'var(--fg-secondary)', fontWeight: 600 }}>
          {label}
          <LoadingDots color={color} />
        </span>
      )}
    </div>
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
interface BarProps {
  progress?: number;
  label?: string;
  hint?: string;
}

function Bar({ progress = 0, label, hint }: BarProps): JSX.Element {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div style={{ maxWidth: 360, width: '100%' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--fg-primary)', fontWeight: 600 }}>{label}</span>
          <span
            style={{
              color: 'var(--accent-yellow)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 100,
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background:
              'linear-gradient(90deg, var(--accent-yellow), var(--orange-500), var(--fire-red))',
            boxShadow: '0 0 12px rgba(253,235,86,0.5)',
            transition: 'width 220ms var(--ease-out)',
          }}
        />
      </div>
      {hint && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-tertiary)' }}>{hint}</div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
interface SkeletonProps {
  height?: number;
  width?: number | string;
  radius?: number;
}

function Skeleton({ height = 16, width = '100%', radius = 6 }: SkeletonProps): JSX.Element {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
        backgroundSize: '200% 100%',
        animation: 'zshimmer 1400ms linear infinite',
      }}
    />
  );
}

export const Loader = { FullScreen, Inline, Bar, Skeleton, ClaimGrid, MiniSpinner, LoadingDots };
