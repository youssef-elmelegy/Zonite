// Zonite Shell — page chrome with corner blobs, top bar.
function CornerBlobs({ intensity = 1 }) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: -120,
          top: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'var(--grad-fire)',
          filter: `blur(40px)`,
          opacity: 0.55 * intensity,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          right: -160,
          bottom: -160,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'var(--magenta-500)',
          filter: 'blur(60px)',
          opacity: 0.55 * intensity,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  );
}

function GridBg() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
        backgroundImage: `
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
      `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9), transparent 75%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9), transparent 75%)',
        animation: 'gridDrift 40s linear infinite',
      }}
    />
  );
}

function TopBar({ onHome, right }) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 28px',
        background: 'rgba(23,14,27,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        onClick={onHome}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <img
          src="assets/zonite-logo.png"
          style={{ width: 36, height: 36, background: '#fff', borderRadius: 8, padding: 4 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '0.08em',
              color: '#fff',
              fontFamily: 'var(--font-display)',
            }}
          >
            ZONITE
          </div>
          <div className="eyebrow" style={{ fontSize: 9 }}>
            by Yalgamers
          </div>
        </div>
      </div>
      {right}
    </div>
  );
}

function PlayerChip({ player = 'KairosX', xp = 2480, onClick }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 100,
          fontSize: 12,
        }}
      >
        <span
          style={{
            color: 'var(--accent-yellow)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          {xp.toLocaleString()}
        </span>
        <span style={{ color: 'var(--fg-tertiary)', letterSpacing: '0.1em' }}>XP</span>
      </div>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 4px',
          borderRadius: 100,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'background 140ms var(--ease-out)',
        }}
        onMouseEnter={(e) => {
          if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={(e) => {
          if (onClick) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--magenta-500),var(--fire-red))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          {(player || 'K')[0].toUpperCase()}
        </div>
        <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 600 }}>
          {player}
        </span>
      </div>
    </div>
  );
}

function Shell({ children, onHome, right, showGrid = true, blobIntensity = 1 }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: 'var(--ink-900)',
        color: 'var(--fg-primary)',
        fontFamily: 'var(--font-ui)',
        overflow: 'hidden',
      }}
    >
      <CornerBlobs intensity={blobIntensity} />
      {showGrid && <GridBg />}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar onHome={onHome} right={right} />
        <div style={{ flex: 1, position: 'relative' }}>{children}</div>
      </div>
    </div>
  );
}

// Reusable primitives
function Btn({
  variant = 'primary',
  children,
  onClick,
  disabled,
  block,
  size = 'md',
  icon,
  type = 'button',
  style: extra,
}) {
  const sizes = {
    sm: { p: '8px 14px', fs: 12 },
    md: { p: '12px 22px', fs: 13 },
    lg: { p: '16px 32px', fs: 15 },
  };
  const s = sizes[size];
  const v = {
    primary: {
      bg: 'var(--accent-yellow)',
      color: 'var(--ink-900)',
      border: '1px solid var(--accent-yellow)',
      hover: 'var(--accent-yellow-deep)',
      shadow: '0 0 24px rgba(253,235,86,0.35)',
    },
    secondary: {
      bg: 'rgba(255,255,255,0.04)',
      color: '#fff',
      border: '1px solid var(--border-default)',
      hover: 'rgba(255,255,255,0.08)',
      shadow: 'none',
    },
    danger: {
      bg: 'rgba(247,23,86,0.12)',
      color: 'var(--fire-red)',
      border: '1px solid var(--fire-red)',
      hover: 'rgba(247,23,86,0.22)',
      shadow: '0 0 16px rgba(247,23,86,0.3)',
    },
    ghost: {
      bg: 'transparent',
      color: 'var(--fg-secondary)',
      border: '1px solid transparent',
      hover: 'rgba(255,255,255,0.04)',
      shadow: 'none',
    },
    blue: {
      bg: 'var(--team-blue)',
      color: 'var(--ink-900)',
      border: '1px solid var(--team-blue)',
      hover: 'var(--team-blue)',
      shadow: '0 0 24px var(--team-blue-soft)',
    },
  }[variant];
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  return (
    <button
      type={type}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => {
        setH(false);
        setP(false);
      }}
      onMouseDown={() => setP(true)}
      onMouseUp={() => setP(false)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'rgba(255,255,255,0.04)' : h ? v.hover : v.bg,
        color: disabled ? 'var(--fg-muted)' : v.color,
        border: disabled ? '1px solid var(--border-default)' : v.border,
        borderRadius: 8,
        padding: s.p,
        fontSize: s.fs,
        fontWeight: 700,
        fontFamily: 'var(--font-ui)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.02em',
        width: block ? '100%' : 'auto',
        transition: 'all 140ms var(--ease-out)',
        boxShadow: disabled ? 'none' : h ? v.shadow : 'none',
        transform: p ? 'scale(0.98)' : 'scale(1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...extra,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: 'rgba(39,29,39,0.55)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, color = 'var(--fire-pink)', style }) {
  return (
    <div className="eyebrow" style={{ color, ...style }}>
      {children}
    </div>
  );
}

Object.assign(window, { Shell, CornerBlobs, GridBg, TopBar, PlayerChip, Btn, Panel, Eyebrow });
