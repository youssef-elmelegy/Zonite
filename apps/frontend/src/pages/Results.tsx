import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Users, LayoutGrid, ArrowLeft, Crown } from 'lucide-react';
import { useGameStore } from '../store/game.store';
import { useRoomStore } from '../store/room.store';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { useAuth } from '../hooks/useAuth';
import { useWindowSize } from '../hooks/useWindowSize';
import { GameMode, TeamColor } from '../shared';
import { resolveSoloColor } from '../utils/playerColor';

export default function Results(): JSX.Element {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const players = useGameStore((s) => s.players);
  const grid = useGameStore((s) => s.grid);
  const size = useGameStore((s) => s.size);
  const isDraw = useGameStore((s) => s.isDraw);
  const gameMode = useRoomStore((s) => s.gameMode);
  const gameRoomCode = useGameStore((s) => s.roomCode);
  const { isMobile, isTablet } = useWindowSize();
  const isNarrow = isMobile || isTablet;

  const rc = gameRoomCode || code || '';
  const socket = useSocket(rc);
  const { results: resultsRef } = useGameState(socket);
  void resultsRef;

  const sorted = Object.values(players).sort((a, b) => b.score - a.score);
  const totalCells = size * size || 1;

  const teamRedScore = Object.values(players)
    .filter((p) => p.teamColor === TeamColor.RED)
    .reduce((acc, p) => acc + p.score, 0);
  const teamBlueScore = Object.values(players)
    .filter((p) => p.teamColor === TeamColor.BLUE)
    .reduce((acc, p) => acc + p.score, 0);

  // Neutral gray reserved for draws — never used in-game so it reads as "no winner".
  const DRAW_COLOR = '#9CA3AF';

  // Solo draw = top score is shared by 2+ players (and > 0).
  const topScore = sorted[0]?.score ?? 0;
  const tiedTop = sorted.filter((p) => p.score === topScore && p.score > 0);
  const isSoloDraw = gameMode === GameMode.SOLO && tiedTop.length > 1;
  const isTeamDraw = gameMode === GameMode.TEAM && (isDraw || teamRedScore === teamBlueScore);

  // Determine winner presentation
  let winnerColor: string;
  let winnerName: string;
  let winnerSub: string;

  if (gameMode === GameMode.TEAM) {
    if (isTeamDraw) {
      winnerColor = DRAW_COLOR;
      winnerName = 'DRAW';
      winnerSub = `${teamRedScore} — ${teamBlueScore}`;
    } else if (teamRedScore > teamBlueScore) {
      winnerColor = 'var(--team-red)';
      winnerName = 'RED TEAM WINS';
      winnerSub = `${teamRedScore} — ${teamBlueScore}`;
    } else {
      winnerColor = 'var(--team-blue)';
      winnerName = 'BLUE TEAM WINS';
      winnerSub = `${teamBlueScore} — ${teamRedScore}`;
    }
  } else if (isSoloDraw) {
    winnerColor = DRAW_COLOR;
    winnerName = 'DRAW';
    winnerSub = `${tiedTop.map((p) => p.fullName).join(' · ')} · ${topScore} blocks`;
  } else {
    const top = sorted[0];
    winnerColor = top ? resolveSoloColor(top) : DRAW_COLOR;
    winnerName = top ? `${top.fullName.toUpperCase()} WINS` : 'RESULTS';
    winnerSub = top
      ? `${top.score} blocks · ${Math.round((top.score / totalCells) * 100)}% of the board`
      : '';
  }

  function handleBackHome() {
    useRoomStore.getState().clearRoom();
    useGameStore.getState().clearGame();
    navigate('/home');
  }

  // Board thumbnail cell size
  const thumbBudget = isMobile ? 200 : 260;
  const thumbSize = size > 0 ? Math.max(3, Math.min(14, Math.floor(thumbBudget / size))) : 6;
  const cappedSize = Math.min(size, 40);

  return (
    <div
      className="fade-in"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: 'var(--font-ui)',
        background: 'var(--bg-page)',
      }}
    >
      {/* Winner color flood */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${winnerColor}, transparent 60%)`,
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${winnerColor}22 0%, transparent 40%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1060,
          margin: '0 auto',
          padding: isMobile ? '20px 12px 32px' : isTablet ? '28px 20px 48px' : '40px 24px 80px',
        }}
      >
        {/* ── Winner Banner ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : isTablet ? 28 : 40 }}>
          <p
            className="eyebrow"
            style={{
              color: winnerColor,
              marginBottom: isMobile ? 10 : 18,
              letterSpacing: isMobile ? '0.25em' : '0.4em',
            }}
          >
            Final Result
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <Trophy size={isMobile ? 36 : 52} color={winnerColor} strokeWidth={1.2} />
          </div>
          <h1
            style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 6vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--fg-primary)',
              textShadow: `0 0 40px ${winnerColor}`,
            }}
          >
            {winnerName}
          </h1>
          <div
            style={{
              fontSize: isMobile ? 13 : 16,
              color: 'var(--fg-tertiary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.06em',
            }}
          >
            {winnerSub}
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr' : '1fr 320px',
            gap: isMobile ? 14 : 24,
            alignItems: 'start',
          }}
        >
          {/* Score breakdown */}
          <div
            style={{
              background: 'rgba(39,29,39,0.5)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              backdropFilter: 'blur(20px)',
              padding: isMobile ? 14 : 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={14} color="var(--accent-yellow)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Score Breakdown
                </h3>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--fg-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {totalCells} cells · {size}×{size}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map((p, i) => {
                const s = p.score;
                const pct = Math.round((s / totalCells) * 100);
                const isTopScorer = s === topScore && s > 0;
                const isDrawnPlayer =
                  (isTeamDraw && gameMode === GameMode.TEAM) || (isSoloDraw && isTopScorer);
                const color = isDrawnPlayer
                  ? DRAW_COLOR
                  : gameMode === GameMode.TEAM
                    ? p.teamColor === TeamColor.RED
                      ? 'var(--team-red)'
                      : 'var(--team-blue)'
                    : resolveSoloColor(p);
                const isWinner = i === 0 && s > 0;
                const isMe = p.id === user?.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '24px 32px 1fr auto'
                        : '32px 44px 1fr auto auto',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 14,
                      padding: isMobile ? '10px 10px' : '14px 16px',
                      background: isWinner
                        ? `linear-gradient(90deg, ${color}22, transparent)`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isWinner ? color : 'var(--border-subtle)'}`,
                      borderRadius: 12,
                      boxShadow: isWinner ? `0 0 20px ${color}40` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: isMobile ? 16 : 22,
                        fontWeight: 800,
                        color: isWinner ? color : 'var(--fg-muted)',
                        textAlign: 'center',
                        lineHeight: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        width: isMobile ? 30 : 40,
                        height: isMobile ? 30 : 40,
                        borderRadius: '50%',
                        background: p.avatarUrl
                          ? 'transparent'
                          : `linear-gradient(135deg, ${color}, rgba(0,0,0,0.4))`,
                        border: `2px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? 12 : 14,
                        fontWeight: 800,
                        color: 'var(--fg-primary)',
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
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: isMobile ? 12 : 14,
                          fontWeight: 700,
                          color: 'var(--fg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.fullName}
                        {isMe && (
                          <span
                            style={{
                              fontSize: 9,
                              color: 'var(--accent-yellow)',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                            }}
                          >
                            YOU
                          </span>
                        )}
                        {isWinner && <Crown size={12} color="var(--accent-yellow)" />}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 6,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 100,
                            overflow: 'hidden',
                            maxWidth: 260,
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: color,
                              boxShadow: `0 0 8px ${color}`,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--fg-tertiary)',
                            fontFamily: 'var(--font-mono)',
                            minWidth: 32,
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: isMobile ? 20 : 26,
                          fontWeight: 800,
                          color: 'var(--fg-primary)',
                          lineHeight: 1,
                        }}
                      >
                        {s}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: 'var(--fg-tertiary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          marginTop: 3,
                        }}
                      >
                        blocks
                      </div>
                    </div>
                    {!isMobile && (
                      <div
                        style={{
                          width: 10,
                          height: 40,
                          borderRadius: 4,
                          background: color,
                          boxShadow: `0 0 10px ${color}`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column — board thumbnail + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
            <div
              style={{
                background: 'rgba(39,29,39,0.5)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                backdropFilter: 'blur(20px)',
                padding: isMobile ? 14 : 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <LayoutGrid size={14} color="var(--accent-yellow)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Final Board
                </h3>
              </div>

              {grid.length > 0 && size > 0 ? (
                <div
                  style={{
                    padding: 8,
                    background: 'rgba(23,14,27,0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cappedSize}, ${thumbSize}px)`,
                      gap: 1,
                    }}
                  >
                    {grid.slice(0, cappedSize).map((row) =>
                      row.slice(0, cappedSize).map((cell, x) => {
                        let bg = 'rgba(255,255,255,0.04)';
                        if (cell.claimedBy) {
                          if (gameMode === GameMode.TEAM) {
                            bg =
                              cell.teamColor === TeamColor.RED
                                ? 'var(--team-red)'
                                : 'var(--team-blue)';
                          } else {
                            const owner = players[cell.claimedBy];
                            bg = owner ? resolveSoloColor(owner) : 'var(--accent-yellow)';
                          }
                        }
                        return (
                          <div
                            key={`${cell.y}-${x}`}
                            style={{
                              width: thumbSize,
                              height: thumbSize,
                              background: bg,
                              borderRadius: 1,
                            }}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--fg-muted)',
                    fontSize: 12,
                  }}
                >
                  No board data
                </div>
              )}

              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--fg-tertiary)',
                }}
              >
                <span>Filled</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>
                  {grid.flat().filter((c) => c.claimedBy).length} / {totalCells}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleBackHome}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--fg-secondary)',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                <ArrowLeft size={16} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
