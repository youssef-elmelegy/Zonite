import { GameStatus } from '@zonite/shared';

export function App(): JSX.Element {
  return (
    <main
      className="fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-6)',
        textAlign: 'center',
      }}
    >
      <h1 className="h1" style={{ color: 'var(--fg-primary)' }}>
        Zonite
      </h1>
      <p className="eyebrow" style={{ color: 'var(--fire-pink)' }}>
        Phase&nbsp;1 — Design Handoff Adopted
      </p>
      <p className="caption" style={{ color: 'var(--fg-tertiary)' }}>
        Shared contract boundary: {GameStatus.LOBBY}
      </p>
    </main>
  );
}
