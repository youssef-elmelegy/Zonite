import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Settings, Crown, Check, Clock, Copy, ArrowLeft, Play, Eye } from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { PlayerChip } from '../components/common/PlayerChip';
import { useAuth } from '../hooks/useAuth';
import { useRoomStore } from '../store/room.store';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { useWindowSize } from '../hooks/useWindowSize';
import { GameEvents, GameMode, RoomEvents, TeamColor } from '../shared';
import type { RoomConfig } from '../shared';
import { resolveSoloColor } from '../utils/playerColor';

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(39,29,39,0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SettingRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
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
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)' }}>{value}</span>
    </div>
  );
}

export default function Lobby(): JSX.Element {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const players = useRoomStore((s) => s.players);
  const gameMode = useRoomStore((s) => s.gameMode);
  const gridSize = useRoomStore((s) => s.gridSize);
  const durationSeconds = useRoomStore((s) => s.durationSeconds);
  const maxPlayers = useRoomStore((s) => s.maxPlayers);
  const isTournament = useRoomStore((s) => s.isTournament);
  const socket = useSocket(code);
  const { countdown } = useGameState(socket);
  const { isMobile, isTablet } = useWindowSize();
  const isNarrow = isMobile || isTablet;

  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copyCode() {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function toggleReady() {
    socket.emit(RoomEvents.PLAYER_READY);
  }

  function startGame() {
    socket.emit(GameEvents.START_GAME, { roomCode: code });
  }

  const emitUpdate = useCallback(
    (patch: Partial<Omit<RoomConfig, 'roomCode'>>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket.emit(RoomEvents.UPDATE_ROOM, { roomCode: code, ...patch });
      }, 300);
    },
    [socket, code],
  );

  const myPlayer = players.find((p) => p.id === user?.id);
  const isHost = !isTournament && (myPlayer?.isHost ?? false);
  const readyCount = players.filter((p) => p.isReady).length;
  const canStart = isHost && readyCount >= 2;

  useEffect(() => {
    const unsub = socket.on(RoomEvents.ROOM_UPDATED, (payload: unknown) => {
      const config = payload as Partial<RoomConfig>;
      const current = useRoomStore.getState();
      useRoomStore.getState().setRoom(code, {
        gameMode: config.gameMode ?? current.gameMode ?? GameMode.SOLO,
        gridSize: config.gridSize ?? current.gridSize ?? 12,
        durationSeconds: config.durationSeconds ?? current.durationSeconds ?? 60,
        maxPlayers: config.maxPlayers ?? current.maxPlayers ?? 6,
      });
    });
    return () => unsub();
  }, [socket, code]);

  useEffect(() => {
    return () => {
      useRoomStore.getState().clearRoom();
    };
  }, []);

  return (
    <Shell
      onHome={() => navigate('/home')}
      right={
        user ? (
          <PlayerChip
            playerName={user.fullName || user.email.split('@')[0]}
            team="neutral"
            onClick={() => navigate('/profile')}
          />
        ) : undefined
      }
    >
      <div
        className="fade-in"
        style={{
          maxWidth: 1060,
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '12px 4px' : isTablet ? '16px 8px' : '20px 24px',
          fontFamily: 'var(--font-ui)',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => {
                useRoomStore.getState().clearRoom();
                navigate('/home');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-tertiary)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <ArrowLeft size={14} /> Leave
            </button>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>
                Room Code
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? 22 : isTablet ? 28 : 32,
                    fontWeight: 800,
                    color: 'var(--accent-yellow)',
                    letterSpacing: isMobile ? '0.12em' : '0.18em',
                    lineHeight: 1,
                  }}
                >
                  {code}
                </span>
                <button
                  type="button"
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
                  {copied ? <Check size={16} /> : <Copy size={16} />}
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
            <Eye size={14} color="var(--fg-tertiary)" />
            <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>
              {maxPlayers ? maxPlayers - players.length : 0} open slot
              {maxPlayers && maxPlayers - players.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 300px', gap: 12 }}
        >
          {/* ── Players list ─────────────────────────────────────────── */}
          <Panel>
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
                <Users size={14} color="var(--accent-yellow)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Players
                </h3>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--fg-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {players.length} / {maxPlayers ?? '?'}
              </span>
            </div>

            {players.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--fg-muted)',
                  fontSize: 13,
                }}
              >
                Waiting for players to join…
              </div>
            ) : (
              players.map((p, i) => {
                const isMe = p.id === user?.id;
                const teamColor =
                  gameMode === GameMode.SOLO
                    ? resolveSoloColor(p)
                    : p.teamColor === TeamColor.RED
                      ? 'var(--team-red)'
                      : p.teamColor === TeamColor.BLUE
                        ? 'var(--team-blue)'
                        : 'var(--fg-muted)';
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 14,
                      padding: isMobile ? '10px 12px' : '14px 20px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                      background: isMe ? 'rgba(253,235,86,0.04)' : 'transparent',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-mono)',
                        width: 18,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div
                      style={{
                        position: 'relative',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: p.avatarUrl
                          ? 'transparent'
                          : `linear-gradient(135deg, ${teamColor}, rgba(0,0,0,0.3))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--fg-primary)',
                        border: `2px solid ${teamColor}`,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        p.fullName[0]?.toUpperCase()
                      )}
                      {!isTournament && p.isHost && (
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
                          <Crown size={9} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? 6 : 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 700,
                            color: 'var(--fg-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {p.fullName}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: 9,
                              color: 'var(--accent-yellow)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                              flexShrink: 0,
                            }}
                          >
                            You
                          </span>
                        )}
                        {!isTournament && p.isHost && (
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
                              flexShrink: 0,
                            }}
                          >
                            Host
                          </span>
                        )}
                      </div>
                      {gameMode === GameMode.TEAM &&
                        p.teamColor &&
                        p.teamColor !== TeamColor.NONE && (
                          <div
                            style={{
                              fontSize: 11,
                              color: teamColor,
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            {p.teamColor === TeamColor.RED ? 'Red Team' : 'Blue Team'}
                          </div>
                        )}
                    </div>

                    {!isMobile && gameMode === GameMode.TEAM && p.teamColor !== TeamColor.NONE && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 100,
                          background:
                            p.teamColor === TeamColor.RED
                              ? 'var(--team-red-soft)'
                              : 'var(--team-blue-soft)',
                          border: `1px solid ${teamColor}`,
                          fontSize: 10,
                          fontWeight: 700,
                          color: teamColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: teamColor,
                          }}
                        />
                        {p.teamColor === TeamColor.RED ? 'Red' : 'Blue'}
                      </div>
                    )}

                    {!isTournament && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: isMobile ? 4 : 6,
                          padding: isMobile ? '4px 8px' : '6px 12px',
                          borderRadius: 100,
                          fontSize: isMobile ? 10 : 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          background: p.isReady ? 'rgba(75,255,84,0.12)' : 'rgba(255,255,255,0.04)',
                          color: p.isReady ? 'var(--lime-300)' : 'var(--fg-tertiary)',
                          border: `1px solid ${p.isReady ? 'var(--lime-300)' : 'var(--border-default)'}`,
                          boxShadow: p.isReady ? '0 0 12px rgba(75,255,84,0.25)' : 'none',
                          transition: 'all 140ms var(--ease-out)',
                          flexShrink: 0,
                          marginLeft: 'auto',
                        }}
                      >
                        {p.isReady ? <Check size={11} /> : <Clock size={11} />}
                        {p.isReady ? 'Ready' : 'Waiting'}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Empty slots */}
            {maxPlayers !== null &&
              Array.from({ length: Math.max(0, (maxPlayers ?? 0) - players.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 14,
                      padding: isMobile ? '10px 12px' : '14px 20px',
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
                        flexShrink: 0,
                      }}
                    >
                      {players.length + i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>
                      Waiting for player…
                    </span>
                  </div>
                ),
              )}
          </Panel>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>
            {/* Settings panel — hidden for tournament matches */}
            {!isTournament && (
              <Panel style={{ padding: isMobile ? 14 : 20, overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Settings size={14} color="var(--accent-yellow)" />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--fg-primary)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Settings
                  </h3>
                </div>
                <SettingRow label="Grid" value={gridSize ? `${gridSize} × ${gridSize}` : '—'} />
                <SettingRow
                  label="Mode"
                  value={
                    gameMode === GameMode.TEAM
                      ? 'Red vs Blue'
                      : gameMode === GameMode.SOLO
                        ? 'Solo'
                        : '—'
                  }
                />
                <SettingRow label="Timer" value={durationSeconds ? `${durationSeconds}s` : '—'} />
                <SettingRow
                  label="Max"
                  value={maxPlayers ? `${maxPlayers} players` : '—'}
                  last={!isHost}
                />

                {isHost && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: 'var(--accent-yellow)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        fontWeight: 700,
                      }}
                    >
                      Edit Config
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {([GameMode.SOLO, GameMode.TEAM] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => emitUpdate({ gameMode: m })}
                          style={{
                            flex: 1,
                            padding: '6px 4px',
                            borderRadius: 6,
                            border: `1px solid ${gameMode === m ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                            background: gameMode === m ? 'rgba(253,235,86,0.08)' : 'transparent',
                            color: gameMode === m ? 'var(--accent-yellow)' : 'var(--fg-tertiary)',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {m === GameMode.SOLO ? 'Solo' : 'Team'}
                        </button>
                      ))}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--fg-tertiary)' }}>
                        Board: {gridSize ?? 12}×{gridSize ?? 12}
                      </p>
                      <input
                        type="range"
                        min={5}
                        max={50}
                        value={gridSize ?? 12}
                        onChange={(e) => emitUpdate({ gridSize: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-yellow)' }}
                      />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--fg-tertiary)' }}>
                        Duration
                      </p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[30, 60, 90, 120].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => emitUpdate({ durationSeconds: d })}
                            style={{
                              flex: 1,
                              padding: '4px 0',
                              borderRadius: 6,
                              border: `1px solid ${durationSeconds === d ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                              background:
                                durationSeconds === d ? 'rgba(253,235,86,0.08)' : 'transparent',
                              color:
                                durationSeconds === d
                                  ? 'var(--accent-yellow)'
                                  : 'var(--fg-tertiary)',
                              fontFamily: 'var(--font-ui)',
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--fg-tertiary)' }}>
                        Max: {maxPlayers ?? 6}
                      </p>
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={maxPlayers ?? 6}
                        onChange={(e) => emitUpdate({ maxPlayers: Number(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--accent-yellow)' }}
                      />
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* Ready / Start panel */}
            <Panel style={{ padding: 16, overflow: 'visible' }}>
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
                  {readyCount} / {players.length}
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
                    width: players.length ? `${(readyCount / players.length) * 100}%` : '0%',
                    height: '100%',
                    background: readyCount >= 2 ? 'var(--lime-300)' : 'var(--accent-yellow)',
                    transition: 'width 300ms var(--ease-out)',
                  }}
                />
              </div>

              {isTournament ? (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 8,
                    background: 'rgba(253,235,86,0.06)',
                    border: '1px dashed var(--accent-yellow)',
                    color: 'var(--accent-yellow)',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: 13,
                    textAlign: 'center',
                    letterSpacing: '0.04em',
                  }}
                >
                  Waiting for tournament to start…
                </div>
              ) : isHost ? (
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={startGame}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px',
                    background: canStart ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.04)',
                    border: canStart ? 'none' : '1px solid var(--border-default)',
                    borderRadius: 8,
                    color: canStart ? 'var(--ink-900)' : 'var(--fg-muted)',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    boxShadow: canStart ? '0 0 20px rgba(253,235,86,0.35)' : 'none',
                    transition: 'all 140ms var(--ease-out)',
                  }}
                >
                  <Play size={16} />
                  {canStart ? 'Start Game' : readyCount < 2 ? 'Need 2 Ready' : 'Host Only'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleReady}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px',
                    background: myPlayer?.isReady ? 'rgba(75,255,84,0.12)' : 'var(--accent-yellow)',
                    border: myPlayer?.isReady ? '1px solid var(--lime-300)' : 'none',
                    borderRadius: 8,
                    color: myPlayer?.isReady ? 'var(--lime-300)' : 'var(--ink-900)',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'all 140ms var(--ease-out)',
                  }}
                >
                  {myPlayer?.isReady ? <Check size={16} /> : <Clock size={16} />}
                  {myPlayer?.isReady ? 'Not Ready' : 'Ready Up'}
                </button>
              )}

              {isHost && !canStart && readyCount < 2 && (
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
      {countdown !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200,
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
              fontSize: 'var(--fs-sm)',
              color: 'var(--fg-tertiary)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            Match starting in
          </span>
          <span
            key={countdown}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(80px, 20vw, 160px)',
              fontWeight: 900,
              color: countdown <= 2 ? 'var(--fire-red)' : 'var(--accent-yellow)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              animation: 'countdown-pop 0.9s var(--ease-out) both',
            }}
          >
            {countdown}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-base)',
              color: 'var(--fg-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Get ready!
          </span>
        </div>
      )}
    </Shell>
  );
}
