import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, LogOut, Trophy, Crown, X, Menu, Swords, Target } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { GridCell } from '../components/game/GridCell';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/game.store';
import { useRoomStore } from '../store/room.store';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { useWindowSize } from '../hooks/useWindowSize';
import { GameEvents, GameMode, TeamColor } from '@zonite/shared';
import type { Block } from '@zonite/shared';
import { resolveSoloColor } from '../utils/playerColor';

interface LiveClaim {
  name: string;
  color: string;
  cell: string;
  ts: number;
  isMe: boolean;
}

function cellLabel(x: number, y: number): string {
  return `${String.fromCharCode(65 + x)}${y + 1}`;
}

export default function Game(): JSX.Element {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket(code);
  useGameState(socket);
  const { isMobile, isTablet, width } = useWindowSize();
  const isNarrow = isMobile || isTablet;

  const grid = useGameStore((s) => s.grid);
  const players = useGameStore((s) => s.players);
  const remainingSeconds = useGameStore((s) => s.remainingSeconds);
  const size = useGameStore((s) => s.size);
  const gameMode = useRoomStore((s) => s.gameMode);

  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isNarrow);
  const [recentClaims, setRecentClaims] = useState<LiveClaim[]>([]);

  // Track live claims for the feed
  useEffect(() => {
    const unsub = socket.on(GameEvents.BLOCK_CLAIMED, (payload: unknown) => {
      const block = payload as Block;
      if (!block.claimedBy) return;
      const player = useGameStore.getState().players[block.claimedBy];
      if (!player) return;
      const color =
        gameMode === GameMode.TEAM
          ? player.teamColor === TeamColor.RED
            ? 'var(--team-red)'
            : 'var(--team-blue)'
          : resolveSoloColor(player);
      setRecentClaims((prev) => [
        {
          name: player.fullName,
          color,
          cell: cellLabel(block.x, block.y),
          ts: Date.now(),
          isMe: block.claimedBy === user?.id,
        },
        ...prev.slice(0, 9),
      ]);
    });
    return () => unsub();
  }, [socket, gameMode, user?.id]);

  function handleCellClick(_id: string, row: number, col: number) {
    const block = grid[row]?.[col];
    if (!block || block.claimedBy) return;
    socket.emit(GameEvents.CLAIM_BLOCK, { x: col, y: row });
    setJustClaimed(`${row}-${col}`);
    setTimeout(() => setJustClaimed(null), 500);
  }

  // Derive per-cell state and color
  function cellProps(
    row: number,
    col: number,
  ): { state: 'empty' | 'own' | 'opponent'; color?: string } {
    const block = grid[row]?.[col];
    if (!block || !block.claimedBy) return { state: 'empty' };
    const owner = players[block.claimedBy];
    if (gameMode === GameMode.TEAM) {
      const mine = user ? players[user.id] : null;
      const sameTeam =
        mine && owner && mine.teamColor === owner.teamColor && mine.teamColor !== TeamColor.NONE;
      const teamColor = owner?.teamColor === TeamColor.RED ? 'var(--team-red)' : 'var(--team-blue)';
      return { state: sameTeam ? 'own' : 'opponent', color: teamColor };
    }
    // Solo: per-player color (deterministic fallback if server sent empty)
    return {
      state: block.claimedBy === user?.id ? 'own' : 'opponent',
      color: owner ? resolveSoloColor(owner) : undefined,
    };
  }

  // Timer formatting
  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');
  const isCritical = remainingSeconds > 0 && remainingSeconds <= 10;
  const isWarning = remainingSeconds > 10 && remainingSeconds <= 20;
  const timerColor = isCritical
    ? 'var(--fire-red)'
    : isWarning
      ? 'var(--orange-500)'
      : 'var(--accent-yellow)';

  // Compute cell size based on available width estimate
  const cellSize = useMemo(() => {
    if (size === 0) return 28;
    const sidebarOffset = sidebarOpen && !isNarrow ? 280 : 0;
    const maxW = Math.max(220, width - sidebarOffset - 60);
    const maxH = isMobile ? 360 : isTablet ? 440 : 520;
    const maxCell = isMobile ? 36 : 52;
    return Math.max(8, Math.min(maxCell, Math.floor(maxW / size) - 2, Math.floor(maxH / size) - 2));
  }, [size, sidebarOpen, isNarrow, isMobile, isTablet, width]);

  const gap = cellSize > 20 ? 3 : 2;

  // Scores
  const sortedPlayers = useMemo(
    () => Object.values(players).sort((a, b) => b.score - a.score),
    [players],
  );
  const teamRedScore = useMemo(
    () =>
      Object.values(players)
        .filter((p) => p.teamColor === TeamColor.RED)
        .reduce((acc, p) => acc + p.score, 0),
    [players],
  );
  const teamBlueScore = useMemo(
    () =>
      Object.values(players)
        .filter((p) => p.teamColor === TeamColor.BLUE)
        .reduce((acc, p) => acc + p.score, 0),
    [players],
  );
  const totalCells = size * size;
  const myPlayer = user ? players[user.id] : null;

  return (
    <Shell onHome={() => navigate('/home')} showGrid={false} blobIntensity={0} right={undefined}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          margin: isMobile
            ? 'calc(-1 * var(--sp-3))'
            : isTablet
              ? 'calc(-1 * var(--sp-6))'
              : 'calc(-1 * var(--sp-8)) calc(-1 * var(--sp-12))',
          fontFamily: 'var(--font-ui)',
          overflow: 'hidden',
        }}
      >
        {/* ── HUD Bar ──────────────────────────────────────────────── */}
        <div
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexWrap: isMobile ? 'wrap' : undefined,
            gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : undefined,
            gap: isMobile ? 8 : 16,
            padding: isMobile ? '8px 10px' : '10px 20px',
            background: 'rgba(23,14,27,0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-default)',
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          {/* Left — room info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
                {code}
              </div>
            </div>
            <div
              style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }}
            />
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
                  color: 'var(--fg-primary)',
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {gameMode === GameMode.TEAM ? (
                  <>
                    <Swords size={12} /> Red vs Blue
                  </>
                ) : (
                  <>
                    <Target size={12} /> Solo
                  </>
                )}
              </div>
            </div>
            <div
              style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }}
            />
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
                  color: 'var(--fg-primary)',
                  marginTop: 2,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {size}×{size}
              </div>
            </div>
          </div>

          {/* Center — timer */}
          <div
            className={isCritical ? 'timer-critical' : ''}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 10,
              padding: isMobile ? '6px 12px' : '8px 20px',
              background: isCritical
                ? 'rgba(247,23,86,0.15)'
                : isWarning
                  ? 'rgba(240,133,25,0.12)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${timerColor}`,
              borderRadius: 12,
              boxShadow: isCritical
                ? '0 0 24px rgba(247,23,86,0.5)'
                : isWarning
                  ? '0 0 16px rgba(240,133,25,0.3)'
                  : 'none',
            }}
          >
            <Clock size={isMobile ? 14 : 18} color={timerColor} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 22 : isTablet ? 28 : 36,
                fontWeight: 800,
                color: timerColor,
                letterSpacing: '0.05em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {mm}:{ss}
            </span>
          </div>

          {/* Right — scores + sidebar toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {gameMode === GameMode.TEAM ? (
              <>
                <TeamScoreBadge
                  color="var(--team-red)"
                  soft="var(--team-red-soft)"
                  label="RED"
                  score={teamRedScore}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  VS
                </span>
                <TeamScoreBadge
                  color="var(--team-blue)"
                  soft="var(--team-blue-soft)"
                  label="BLUE"
                  score={teamBlueScore}
                />
              </>
            ) : (
              sortedPlayers[0] && (
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
                  <Trophy size={14} color="var(--accent-yellow)" />
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: resolveSoloColor(sortedPlayers[0]),
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>
                    {sortedPlayers[0].fullName}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--accent-yellow)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {sortedPlayers[0].score}
                  </span>
                </div>
              )
            )}
            <button
              type="button"
              onClick={() => navigate('/home')}
              title="Leave game"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(247,23,86,0.12)',
                border: '1px solid var(--fire-red)',
                color: 'var(--fire-red)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <LogOut size={12} /> Leave
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>

        {/* ── Main area ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Grid */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: isMobile ? 'var(--sp-2)' : 'var(--sp-4)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            {grid.length > 0 ? (
              <div
                style={{
                  padding: 14,
                  background: 'rgba(23,14,27,0.5)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 16,
                  display: 'inline-block',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
                    gap,
                  }}
                >
                  {grid.map((row, y) =>
                    row.map((_, x) => {
                      const { state, color } = cellProps(y, x);
                      const key = `${y}-${x}`;
                      return (
                        <GridCell
                          key={key}
                          id={key}
                          row={y}
                          col={x}
                          state={state}
                          color={color}
                          isOwnBlock={grid[y]?.[x]?.claimedBy === user?.id}
                          justClaimed={justClaimed === key}
                          onClick={handleCellClick}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--fg-muted)',
                }}
              >
                Waiting for game state…
              </div>
            )}
          </div>

          {/* Sidebar */}
          {sidebarOpen && (
            <div
              style={{
                width: isNarrow ? Math.min(300, width - 40) : 280,
                background: 'var(--bg-elevated)',
                borderLeft: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                flexShrink: 0,
                position: isNarrow ? 'absolute' : 'static',
                top: isNarrow ? 0 : undefined,
                right: isNarrow ? 0 : undefined,
                bottom: isNarrow ? 0 : undefined,
                zIndex: isNarrow ? 20 : undefined,
                boxShadow: isNarrow ? '-4px 0 24px rgba(0,0,0,0.5)' : undefined,
              }}
            >
              {/* Leaderboard */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Trophy size={14} color="var(--accent-yellow)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Leaderboard
                </h3>
              </div>

              {gameMode === GameMode.TEAM ? (
                <div
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: 'Red',
                      score: teamRedScore,
                      color: 'var(--team-red)',
                      soft: 'var(--team-red-soft)',
                    },
                    {
                      label: 'Blue',
                      score: teamBlueScore,
                      color: 'var(--team-blue)',
                      soft: 'var(--team-blue-soft)',
                    },
                  ].map(({ label, score, color, soft }) => (
                    <div
                      key={label}
                      style={{
                        padding: '10px 14px',
                        background: soft,
                        border: `1px solid ${color}`,
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {label} Team
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 22,
                            fontWeight: 800,
                            color: 'var(--fg-primary)',
                          }}
                        >
                          {score}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 100,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${totalCells ? (score / totalCells) * 100 : 0}%`,
                            height: '100%',
                            background: color,
                            transition: 'width 300ms var(--ease-out)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {sortedPlayers.map((p, i) => {
                      const pColor =
                        p.teamColor === TeamColor.RED ? 'var(--team-red)' : 'var(--team-blue)';
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 0',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--fg-muted)',
                              minWidth: 16,
                              textAlign: 'right',
                            }}
                          >
                            #{i + 1}
                          </span>
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: pColor,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 12,
                              color: 'var(--fg-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.fullName}
                            {p.id === user?.id && (
                              <span
                                style={{
                                  color: 'var(--accent-yellow)',
                                  marginLeft: 4,
                                  fontSize: 9,
                                }}
                              >
                                you
                              </span>
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: 'var(--fg-primary)',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {p.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '6px 0' }}>
                  {sortedPlayers.map((p, i) => {
                    const pct = totalCells ? Math.round((p.score / totalCells) * 100) : 0;
                    const isMe = p.id === user?.id;
                    const pColor = resolveSoloColor(p);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isMe ? 'rgba(253,235,86,0.05)' : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            fontSize: 10,
                            color: i === 0 ? 'var(--accent-yellow)' : 'var(--fg-muted)',
                            fontWeight: 800,
                            fontFamily: 'var(--font-display)',
                            textAlign: 'center',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: pColor,
                            boxShadow: `0 0 6px ${pColor}`,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--fg-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.fullName}
                            {isMe && (
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
                            {i === 0 && (
                              <Crown
                                size={10}
                                color="var(--accent-yellow)"
                                style={{ marginLeft: 4, display: 'inline' }}
                              />
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
                                background: pColor,
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
                              color: 'var(--fg-primary)',
                              fontFamily: 'var(--font-display)',
                              lineHeight: 1,
                            }}
                          >
                            {p.score}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: 'var(--fg-tertiary)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {pct}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live claims feed */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--fg-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    marginBottom: 8,
                  }}
                >
                  Live Claims
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    maxHeight: 140,
                    overflow: 'hidden',
                  }}
                >
                  {recentClaims.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>No claims yet.</div>
                  )}
                  {recentClaims.map((c, i) => (
                    <div
                      key={c.ts}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        opacity: 1 - i * 0.08,
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: c.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: c.isMe ? 'var(--accent-yellow)' : c.color,
                          fontWeight: 700,
                        }}
                      >
                        {c.isMe ? 'You' : c.name}
                      </span>
                      <span style={{ color: 'var(--fg-tertiary)' }}>→</span>
                      <span
                        style={{
                          color: 'var(--fg-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                        }}
                      >
                        {c.cell}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Solo bottom bar */}
        {gameMode === GameMode.SOLO &&
          myPlayer &&
          (() => {
            const myColor = resolveSoloColor(myPlayer);
            return (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  background: 'rgba(23,14,27,0.8)',
                  borderTop: '1px solid var(--border-default)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: myColor,
                      boxShadow: `0 0 10px ${myColor}`,
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      {myPlayer.fullName}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 32,
                      fontWeight: 800,
                      color: myColor,
                      lineHeight: 1,
                    }}
                  >
                    {myPlayer.score}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>
                    blocks · {totalCells ? Math.round((myPlayer.score / totalCells) * 100) : 0}%
                  </span>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Reconnect overlay */}
      {!socket.isConnected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-4)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-2xl)',
              color: 'var(--accent-yellow)',
              letterSpacing: '0.1em',
            }}
          >
            RECONNECTING…
          </span>
          <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>
            Your blocks are held for 15 seconds
          </span>
        </div>
      )}
    </Shell>
  );
}

function TeamScoreBadge({
  color,
  soft,
  label,
  score,
}: {
  color: string;
  soft: string;
  label: string;
  score: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: soft,
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
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--fg-primary)',
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  );
}
