// Create Room — configure grid, mode, time, max players.
function CreateRoom({ onCreate, onBack, defaults }) {
  const [size, setSize] = React.useState(defaults?.size ?? defaults?.width ?? 12);
  const [mode, setMode] = React.useState(defaults?.mode ?? 'team'); // 'solo' | 'team'
  const [time, setTime] = React.useState(defaults?.time ?? 60);
  const [maxPlayers, setMaxPlayers] = React.useState(defaults?.maxPlayers ?? 6);
  const [created, setCreated] = React.useState(null); // {code}
  const [copied, setCopied] = React.useState(false);

  const submit = () => {
    const code = Array.from({ length: 6 })
      .map(() => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 30)])
      .join('');
    setCreated({ code, width: size, height: size, size, mode, time, maxPlayers });
  };
  const go = () => onCreate(created);
  const copyCode = () => {
    navigator.clipboard?.writeText(created.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (created) {
    return (
      <div
        data-screen-label="02 Create / Code"
        style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}
      >
        <Eyebrow color="var(--accent-yellow)" style={{ marginBottom: 20 }}>
          Room Created
        </Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            margin: 0,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          Share this code with friends
        </h2>
        <p style={{ color: 'var(--fg-tertiary)', fontSize: 13, marginTop: 10, marginBottom: 32 }}>
          They'll tap “Join Room” on the Zonite home and enter it.
        </p>

        <Panel style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            {created.code.split('').map((ch, i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 72,
                  background: 'rgba(23,14,27,0.8)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 38,
                  fontWeight: 800,
                  color: 'var(--accent-yellow)',
                  boxShadow: 'inset 0 -3px 0 rgba(253,235,86,0.35)',
                }}
              >
                {ch}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn
              variant="secondary"
              size="sm"
              icon={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              onClick={copyCode}
            >
              {copied ? 'Copied' : 'Copy Code'}
            </Btn>
          </div>
        </Panel>

        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <SummaryItem label="Grid" value={`${created.size}×${created.size}`} />
          <SummaryItem label="Mode" value={created.mode === 'solo' ? 'Solo' : 'Red vs Blue'} />
          <SummaryItem label="Timer" value={`${created.time}s`} />
          <SummaryItem label="Players" value={`up to ${created.maxPlayers}`} />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn variant="ghost" onClick={() => setCreated(null)}>
            Edit Settings
          </Btn>
          <Btn variant="primary" icon={<IconArrowRight size={16} />} onClick={go}>
            Enter Lobby
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div
      data-screen-label="02 Create Room"
      style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 64px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" icon={<IconArrowLeft size={14} />} onClick={onBack}>
          Back
        </Btn>
        <div style={{ marginLeft: 'auto' }}>
          <Eyebrow>Create Room</Eyebrow>
        </div>
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 44,
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
          color: '#fff',
        }}
      >
        Configure Match
      </h1>
      <p style={{ color: 'var(--fg-tertiary)', fontSize: 14, marginBottom: 32 }}>
        Tune the board, mode, and timer. You'll get a 6-character code to share.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Grid size + preview — single slider, board is always a square */}
        <Panel style={{ padding: 24, gridColumn: '1 / -1' }}>
          <SectionHeader
            icon={<IconGrid size={14} />}
            title="Grid Size"
            caption={`${size * size} total cells · always square`}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 260px',
              gap: 32,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Slider
              label="Board Size"
              value={size}
              min={5}
              max={50}
              onChange={setSize}
              unit={`× ${size}`}
            />
            <GridPreview w={size} h={size} />
          </div>
        </Panel>

        {/* Mode */}
        <Panel style={{ padding: 24 }}>
          <SectionHeader icon={<IconSwords size={14} />} title="Game Mode" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <ModeCard
              active={mode === 'solo'}
              onClick={() => setMode('solo')}
              icon={<IconTarget size={18} />}
              title="Solo"
              desc="Free-for-all · every player a color"
            />
            <ModeCard
              active={mode === 'team'}
              onClick={() => setMode('team')}
              icon={<IconSwords size={18} />}
              title="Red vs Blue"
              desc="Two teams · claim for your color"
            />
          </div>
        </Panel>

        {/* Time */}
        <Panel style={{ padding: 24 }}>
          <SectionHeader icon={<IconClock size={14} />} title="Time Limit" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 8,
              marginTop: 16,
            }}
          >
            {[30, 60, 90, 120].map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                style={{
                  background: time === t ? 'rgba(253,235,86,0.12)' : 'rgba(255,255,255,0.02)',
                  color: time === t ? 'var(--accent-yellow)' : 'var(--fg-secondary)',
                  border: `1px solid ${time === t ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                  borderRadius: 8,
                  padding: '14px 0',
                  fontWeight: 800,
                  fontSize: 15,
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  boxShadow: time === t ? '0 0 16px rgba(253,235,86,0.25)' : 'none',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                {t}s
              </button>
            ))}
          </div>
        </Panel>

        {/* Max players */}
        <Panel style={{ padding: 24, gridColumn: '1 / -1' }}>
          <SectionHeader
            icon={<IconUsers size={14} />}
            title="Max Players"
            caption={`${maxPlayers} slot${maxPlayers > 1 ? 's' : ''}`}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
            <button onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))} style={stepBtn}>
              <IconX size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${mode === 'team' ? 8 : 10}, 1fr)`,
                gap: 6,
              }}
            >
              {Array.from({ length: mode === 'team' ? 8 : 10 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setMaxPlayers(Math.max(2, i + 1))}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    background: i < maxPlayers ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.04)',
                    border:
                      '1px solid ' +
                      (i < maxPlayers ? 'var(--accent-yellow)' : 'var(--border-default)'),
                    cursor: 'pointer',
                    transition: 'all 120ms var(--ease-out)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setMaxPlayers(Math.min(mode === 'team' ? 8 : 10, maxPlayers + 1))}
              style={stepBtn}
            >
              <IconPlus size={14} />
            </button>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn variant="ghost" onClick={onBack}>
          Cancel
        </Btn>
        <Btn variant="primary" size="lg" icon={<IconArrowRight size={16} />} onClick={submit}>
          Create Room
        </Btn>
      </div>
    </div>
  );
}

const stepBtn = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-default)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function SectionHeader({ icon, title, caption }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--accent-yellow)', display: 'inline-flex' }}>{icon}</span>
      <h3
        style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}
      >
        {title}
      </h3>
      {caption && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: 'var(--fg-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, onChange, unit }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--accent-yellow)',
          }}
        >
          {value}
          <span
            style={{
              color: 'var(--fg-muted)',
              fontSize: 11,
              marginLeft: 6,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-yellow)' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: 'var(--fg-muted)',
          marginTop: 2,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function GridPreview({ w, h }) {
  // show scaled-down preview, capped visually
  const cols = w,
    rows = h;
  const cellSize = Math.min(10, Math.floor(200 / Math.max(cols, rows)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          padding: 10,
          background: 'rgba(23,14,27,0.6)',
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 1 }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => {
            const r = (i * 2654435761) % 100;
            const st = r < 12 ? 'red' : r < 24 ? 'blue' : 'empty';
            return (
              <div
                key={i}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background:
                    st === 'red'
                      ? 'var(--team-red)'
                      : st === 'blue'
                        ? 'var(--team-blue)'
                        : 'rgba(255,255,255,0.06)',
                  borderRadius: 1,
                }}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--fg-tertiary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
        }}
      >
        {w} × {h} = {w * h} cells
      </div>
    </div>
  );
}

function ModeCard({ active, onClick, icon, title, desc }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: active ? 'rgba(253,235,86,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        boxShadow: active ? '0 0 20px rgba(253,235,86,0.18)' : 'none',
        transition: 'all 140ms var(--ease-out)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            color: active ? 'var(--accent-yellow)' : 'var(--fg-tertiary)',
            display: 'inline-flex',
          }}
        >
          {icon}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>{desc}</span>
    </button>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
    </div>
  );
}

window.CreateRoom = CreateRoom;
