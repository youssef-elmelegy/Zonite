export function LoadingDot(): JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
      }}
    >
      <span
        className="z-loading-pulse"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--accent-yellow)',
          display: 'inline-block',
        }}
      />
    </div>
  );
}
