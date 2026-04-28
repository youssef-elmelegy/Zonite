// Room Lobby — players list, ready toggles, host-only start button.
function Lobby({ room, onStart, onLeave, setRoom }) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const toggleReady = (id) => {
    setRoom((r) => ({
      ...r,
      players: r.players.map((p) => (p.id === id ? { ...p, ready: !p.ready } : p)),
    }));
  };

  // simulate bots occasionally toggling ready
  React.useEffect(() => {
    const id = setInterval(() => {
      setRoom((r) => {
        const bots = r.players.filter((p) => !p.isYou && !p.ready);
        if (bots.length === 0) return r;
        const pick = bots[Math.floor(Math.random() * bots.length)];
        return {
          ...r,
          players: r.players.map((p) => (p.id === pick.id ? { ...p, ready: true } : p)),
        };
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const readyCount = room.players.filter((p) => p.ready).length;
  const canStart = readyCount >= 2 && room.players.find((p) => p.isYou)?.isHost;

  return (
    <div
      data-screen-label="03 Room Lobby"
      style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Room code header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Btn variant="ghost" size="sm" icon={<IconArrowLeft size={14} />} onClick={onLeave}>
            Leave
          </Btn>
          <div>
            <Eyebrow>Room Code</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 44,
                  fontWeight: 800,
                  color: 'var(--accent-yellow)',
                  letterSpacing: '0.18em',
                  lineHeight: 1,
                }}
              >
                {room.code}
              </div>
              <button
                onClick={copyCode}
                title="Copy code"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  color: copied ? 'var(--lime-300)' : 'var(--fg-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 100,
          }}
        >
          <IconEye size={14} stroke="var(--fg-tertiary)" />
          <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>Spectating</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'var(--font-display)',
            }}
          >
            {room.spectators}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Players list */}
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconUsers size={14} stroke="var(--accent-yellow)" />
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Players
              </h3>
            </div>
            <span
              style={{ fontSize: 12, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              {room.players.length} / {room.maxPlayers}
            </span>
          </div>
          <div>
            {room.players.map((p, i) => (
              <PlayerRow
                key={p.id}
                p={p}
                mode={room.mode}
                idx={i}
                onToggle={() => toggleReady(p.id)}
              />
            ))}
            {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map(
              (_, i) => (
                <div
                  key={'empty' + i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 20px',
                    borderTop: '1px dashed var(--border-subtle)',
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px dashed var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--fg-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {room.players.length + i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>
                    Waiting for player…
                  </span>
                </div>
              ),
            )}
          </div>
        </Panel>

        {/* Settings + Start */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <IconSettings size={14} stroke="var(--accent-yellow)" />
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Settings
              </h3>
            </div>
            <SettingRow label="Grid" value={`${room.width} × ${room.height}`} />
            <SettingRow label="Mode" value={room.mode === 'solo' ? 'Solo' : 'Red vs Blue'} />
            <SettingRow label="Timer" value={`${room.time}s`} />
            <SettingRow label="Max" value={`${room.maxPlayers} players`} last />
          </Panel>

          <Panel style={{ padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                fontSize: 11,
                color: 'var(--fg-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              <span>Ready</span>
              <span
                style={{
                  color: readyCount >= 2 ? 'var(--lime-300)' : 'var(--accent-yellow)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {readyCount} / {room.players.length}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 100,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: `${(readyCount / room.players.length) * 100}%`,
                  height: '100%',
                  background: readyCount >= 2 ? 'var(--lime-300)' : 'var(--accent-yellow)',
                  transition: 'width 300ms var(--ease-out)',
                  boxShadow: '0 0 10px currentColor',
                }}
              />
            </div>
            <Btn
              variant="primary"
              block
              size="lg"
              disabled={!canStart}
              icon={<IconPlay size={16} />}
              onClick={onStart}
            >
              {canStart ? 'Start Game' : readyCount < 2 ? 'Need 2 Ready' : 'Host Only'}
            </Btn>
            {!canStart && readyCount < 2 && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-tertiary)',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                Waiting on {2 - readyCount} more player{2 - readyCount > 1 ? 's' : ''}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ p, mode, idx, onToggle }) {
  const teamColor =
    mode === 'solo' ? p.color : p.team === 'red' ? 'var(--team-red)' : 'var(--team-blue)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 20px',
        borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
        background: p.isYou ? 'rgba(253,235,86,0.04)' : 'transparent',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-mono)',
          width: 18,
          textAlign: 'right',
        }}
      >
        #{idx + 1}
      </div>
      <div
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${teamColor}, rgba(0,0,0,0.3))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: '#fff',
          border: `2px solid ${teamColor}`,
        }}
      >
        {p.name[0]}
        {p.isHost && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--accent-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-900)',
            }}
          >
            <IconCrown size={10} sw={2} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.name}</span>
          {p.isYou && (
            <span
              style={{
                fontSize: 9,
                color: 'var(--accent-yellow)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              You
            </span>
          )}
          {p.isHost && (
            <span
              style={{
                fontSize: 9,
                color: 'var(--accent-yellow)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                padding: '2px 6px',
                background: 'rgba(253,235,86,0.12)',
                borderRadius: 4,
              }}
            >
              Host
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {mode === 'team' ? (
            <span style={{ color: teamColor, fontWeight: 700 }}>
              {p.team === 'red' ? 'Red Team' : 'Blue Team'}
            </span>
          ) : (
            <>
              Rank {p.rank} · {p.wins} wins
            </>
          )}
        </div>
      </div>
      {mode === 'team' && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 100,
            background: p.team === 'red' ? 'var(--team-red-soft)' : 'var(--team-blue-soft)',
            border: `1px solid ${teamColor}`,
            fontSize: 10,
            fontWeight: 700,
            color: teamColor,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: teamColor,
              boxShadow: `0 0 8px ${teamColor}`,
            }}
          />
          {p.team}
        </div>
      )}
      <button
        onClick={p.isYou ? onToggle : undefined}
        disabled={!p.isYou}
        style={{
          padding: '6px 12px',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          cursor: p.isYou ? 'pointer' : 'default',
          background: p.ready ? 'rgba(75,255,84,0.12)' : 'rgba(255,255,255,0.04)',
          color: p.ready ? 'var(--lime-300)' : 'var(--fg-tertiary)',
          border: `1px solid ${p.ready ? 'var(--lime-300)' : 'var(--border-default)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: p.ready ? '0 0 12px rgba(75,255,84,0.25)' : 'none',
          transition: 'all 140ms var(--ease-out)',
          opacity: p.isYou ? 1 : 0.9,
        }}
      >
        {p.ready ? <IconCheck size={11} sw={2.5} /> : <IconClock size={11} />}
        {p.ready ? 'Ready' : 'Waiting'}
      </button>
    </div>
  );
}

function SettingRow({ label, value, last }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
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
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-ui)' }}>
        {value}
      </span>
    </div>
  );
}

window.Lobby = Lobby;
