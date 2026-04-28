// Game Screen — the core view. Top HUD, grid, leaderboard sidebar, bottom bar.
function Game({ room, onEnd, setRoom }) {
  const total = room.width * room.height;
  const [board, setBoard] = React.useState(() => Array(total).fill(null)); // null | playerId
  const [t, setT] = React.useState(room.time);
  const [lastClaim, setLastClaim] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const you = room.players.find((p) => p.isYou);
  const yourTeam = you?.team;

  // Countdown
  React.useEffect(() => {
    if (t <= 0) {
      const id = setTimeout(() => onEnd({ board, room }), 800);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [t > 0]);

  // Bot claims
  React.useEffect(() => {
    if (t <= 0) return;
    const id = setInterval(
      () => {
        setBoard((b) => {
          const empties = b.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0);
          if (empties.length === 0) return b;
          const bots = room.players.filter((p) => !p.isYou);
          if (bots.length === 0) return b;
          const bot = bots[Math.floor(Math.random() * bots.length)];
          const i = empties[Math.floor(Math.random() * empties.length)];
          const nb = [...b];
          nb[i] = bot.id;
          setLastClaim({ i, ts: Date.now() });
          setEvents((e) => [
            {
              player: bot.name,
              team: room.mode === 'team' ? bot.team : 'solo',
              color: bot.color,
              cell: cellLabel(i, room.width),
              ts: Date.now(),
            },
            ...e.slice(0, 9),
          ]);
          return nb;
        });
      },
      700 + Math.random() * 500,
    );
    return () => clearInterval(id);
  }, [t > 0, room]);

  const claim = (i) => {
    if (t <= 0 || board[i] !== null) return;
    const nb = [...board];
    nb[i] = you.id;
    setBoard(nb);
    setLastClaim({ i, ts: Date.now() });
    setEvents((e) => [
      {
        player: you.name,
        team: room.mode === 'team' ? yourTeam : 'solo',
        color: you.color,
        cell: cellLabel(i, room.width),
        ts: Date.now(),
        you: true,
      },
      ...e.slice(0, 9),
    ]);
  };

  // Scores
  const scores = computeScores(board, room);
  const critical = t <= 10;
  const warning = t <= 20 && t > 10;

  // cell size: try to fit
  const maxBoardW = sidebarOpen ? 820 : 1080;
  const maxBoardH = 540;
  const cellSize = Math.max(
    12,
    Math.min(56, Math.floor(maxBoardW / room.width) - 4, Math.floor(maxBoardH / room.height) - 4),
  );
  const gap = cellSize > 22 ? 4 : 2;

  return (
    <div
      data-screen-label="04 Game"
      style={{ padding: '16px 20px 24px', maxWidth: 1400, margin: '0 auto' }}
    >
      {/* HUD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          marginBottom: 18,
          padding: '12px 18px',
          background: 'rgba(23,14,27,0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--fg-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
              }}
            >
              Room
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--accent-yellow)',
                letterSpacing: '0.18em',
              }}
            >
              {room.code}
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-default)' }} />
          <div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--fg-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
              }}
            >
              Mode
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {room.mode === 'team' ? (
                <>
                  <IconSwords size={12} />
                  Red vs Blue
                </>
              ) : (
                <>
                  <IconTarget size={12} />
                  Solo
                </>
              )}
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border-default)' }} />
          <div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--fg-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
              }}
            >
              Grid
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                marginTop: 2,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {room.width}×{room.height}
            </div>
          </div>
        </div>

        {/* Timer */}
        <GameTimer t={t} critical={critical} warning={warning} />

        {/* Scores */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {room.mode === 'team' ? (
            <>
              <TeamScore team="red" count={scores.teams.red} total={total} />
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--fg-muted)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                VS
              </div>
              <TeamScore team="blue" count={scores.teams.blue} total={total} />
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-default)',
                borderRadius: 100,
              }}
            >
              <IconTrophy size={14} stroke="var(--accent-yellow)" />
              <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>Leader</span>
              {scores.leader && (
                <>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: scores.leader.color,
                      boxShadow: `0 0 8px ${scores.leader.color}`,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {scores.leader.name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--accent-yellow)',
                      fontFamily: 'var(--font-display)',
                      marginLeft: 4,
                    }}
                  >
                    {scores.players[scores.leader.id] || 0}
                  </span>
                </>
              )}
            </div>
          )}
          <Btn
            variant="danger"
            size="sm"
            icon={<IconLogOut size={12} />}
            onClick={() => onEnd({ board, room, forfeit: true })}
          >
            Leave
          </Btn>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: sidebarOpen ? '1fr 300px' : '1fr 0px',
          gap: sidebarOpen ? 18 : 0,
          alignItems: 'start',
        }}
      >
        {/* Board */}
        <div>
          <div
            style={{
              position: 'relative',
              padding: 14,
              background: 'rgba(23,14,27,0.5)',
              backdropFilter: 'blur(30px)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${room.width}, ${cellSize}px)`,
                gap,
              }}
            >
              {board.map((ownerId, i) => {
                const owner = ownerId ? room.players.find((p) => p.id === ownerId) : null;
                const color = owner
                  ? room.mode === 'team'
                    ? owner.team === 'red'
                      ? 'var(--team-red)'
                      : 'var(--team-blue)'
                    : owner.color
                  : null;
                return (
                  <Cell
                    key={i}
                    i={i}
                    cellSize={cellSize}
                    gap={gap}
                    owner={owner}
                    color={color}
                    onClick={() => claim(i)}
                    justClaimed={lastClaim && lastClaim.i === i}
                    ended={t <= 0}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom bar (solo mode) */}
          {room.mode === 'solo' && (
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                background: 'rgba(23,14,27,0.6)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: you.color,
                    boxShadow: `0 0 10px ${you.color}`,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--fg-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                    }}
                  >
                    Your Color
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{you.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 32,
                    fontWeight: 800,
                    color: you.color,
                    lineHeight: 1,
                  }}
                >
                  {scores.players[you.id] || 0}
                </span>
                <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>
                  blocks · {Math.round(((scores.players[you.id] || 0) / total) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — leaderboard */}
        <div style={{ position: 'relative' }}>
          {sidebarOpen && (
            <Panel style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconTrophy size={14} stroke="var(--accent-yellow)" />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Leaderboard
                  </h3>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--fg-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <IconX size={14} />
                </button>
              </div>
              <div style={{ padding: '6px 0' }}>
                {scores.sorted.map((s, i) => (
                  <PlayerScoreRow
                    key={s.id}
                    rank={i + 1}
                    player={s}
                    score={scores.players[s.id] || 0}
                    total={total}
                    mode={room.mode}
                  />
                ))}
              </div>
              {/* Live feed */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px' }}>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, color: 'var(--fg-tertiary)', marginBottom: 8 }}
                >
                  Live Claims
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    maxHeight: 140,
                    overflow: 'auto',
                  }}
                >
                  {events.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>No claims yet.</div>
                  )}
                  {events.map((e, i) => {
                    const col =
                      e.color || (e.team === 'red' ? 'var(--team-red)' : 'var(--team-blue)');
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          opacity: 1 - i * 0.08,
                        }}
                      >
                        <div
                          style={{ width: 5, height: 5, borderRadius: '50%', background: col }}
                        />
                        <span style={{ color: col, fontWeight: 700 }}>{e.player}</span>
                        <span style={{ color: 'var(--fg-tertiary)' }}>→</span>
                        <span
                          style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                        >
                          {e.cell}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>
          )}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-default)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconMenu size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Cell({ i, cellSize, owner, color, onClick, justClaimed, ended }) {
  const [hover, setHover] = React.useState(false);
  const canClick = !owner && !ended;
  return (
    <div
      onClick={canClick ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: cellSize > 22 ? 6 : 3,
        background: owner ? color : canClick && hover ? 'var(--cell-hover)' : 'var(--cell-empty)',
        border: `1px solid ${owner ? 'transparent' : canClick && hover ? 'var(--cell-hover-border)' : 'var(--cell-empty-border)'}`,
        cursor: canClick ? 'pointer' : ended ? 'not-allowed' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: Math.min(12, cellSize * 0.42),
        fontWeight: 800,
        boxShadow: owner
          ? `0 0 ${cellSize * 0.25}px ${color}, inset 0 0 0 2px rgba(255,255,255,0.15)`
          : canClick && hover
            ? '0 0 10px rgba(253,235,86,0.25)'
            : 'none',
        transform: canClick && hover ? 'scale(1.06)' : 'scale(1)',
        animation: justClaimed ? 'claimPulse 350ms var(--ease-out)' : 'none',
        transition:
          'background 140ms var(--ease-out), transform 120ms var(--ease-out), box-shadow 140ms',
        opacity: ended && !owner ? 0.5 : 1,
        userSelect: 'none',
        position: 'relative',
      }}
      title={owner ? owner.name : ''}
    >
      {owner && cellSize >= 28 && (hover ? owner.name[0] : '')}
    </div>
  );
}

function GameTimer({ t, critical, warning }) {
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  const color = critical
    ? 'var(--fire-red)'
    : warning
      ? 'var(--orange-500)'
      : 'var(--accent-yellow)';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 20px',
        background: critical
          ? 'rgba(247,23,86,0.15)'
          : warning
            ? 'rgba(240,133,25,0.12)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}`,
        borderRadius: 12,
        boxShadow: critical
          ? '0 0 24px rgba(247,23,86,0.5)'
          : warning
            ? '0 0 16px rgba(240,133,25,0.3)'
            : 'none',
        animation: critical ? 'timerPulse 1s infinite' : 'none',
      }}
    >
      <IconClock size={18} stroke={color} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 800,
          color,
          letterSpacing: '0.05em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {mm}:{ss}
      </span>
    </div>
  );
}

function TeamScore({ team, count, total }) {
  const color = team === 'red' ? 'var(--team-red)' : 'var(--team-blue)';
  const label = team === 'red' ? 'RED' : 'BLUE';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: team === 'red' ? 'var(--team-red-soft)' : 'var(--team-blue-soft)',
        border: `1px solid ${color}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <span style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '0.18em' }}>{label}</span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function PlayerScoreRow({ rank, player, score, total, mode }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const color =
    mode === 'team'
      ? player.team === 'red'
        ? 'var(--team-red)'
        : 'var(--team-blue)'
      : player.color;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: player.isYou ? 'rgba(253,235,86,0.05)' : 'transparent',
      }}
    >
      <div
        style={{
          width: 18,
          fontSize: 10,
          color: rank === 1 ? 'var(--accent-yellow)' : 'var(--fg-muted)',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          textAlign: 'center',
        }}
      >
        {rank}
      </div>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player.name}
          {player.isYou && (
            <span
              style={{
                color: 'var(--accent-yellow)',
                marginLeft: 4,
                fontSize: 9,
                letterSpacing: '0.12em',
              }}
            >
              YOU
            </span>
          )}
        </div>
        <div
          style={{
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 100,
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: color,
              transition: 'width 300ms var(--ease-out)',
            }}
          />
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 9, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {pct}%
        </div>
      </div>
    </div>
  );
}

function cellLabel(i, w) {
  const col = String.fromCharCode(65 + (i % w));
  const row = Math.floor(i / w) + 1;
  return `${col}${row}`;
}

function computeScores(board, room) {
  const players = {};
  room.players.forEach((p) => (players[p.id] = 0));
  const teams = { red: 0, blue: 0 };
  board.forEach((id) => {
    if (id === null) return;
    players[id] = (players[id] || 0) + 1;
    const p = room.players.find((x) => x.id === id);
    if (p && p.team) teams[p.team]++;
  });
  const sorted = [...room.players].sort((a, b) => (players[b.id] || 0) - (players[a.id] || 0));
  return { players, teams, sorted, leader: sorted[0] };
}

Object.assign(window, { Game, computeScores, cellLabel });
