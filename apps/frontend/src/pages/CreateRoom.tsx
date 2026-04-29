import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '../shared';
import {
  LayoutGrid,
  Swords,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Target,
  Plus,
  Minus,
} from 'lucide-react';
import { roomService } from '../services/room.service';
import { useRoomStore } from '../store/room.store';
import { useAuth } from '../hooks/useAuth';
import { useWindowSize } from '../hooks/useWindowSize';
import { Shell } from '../components/layout/Shell';
import { PlayerChip } from '../components/common/PlayerChip';

const DURATION_OPTIONS = [30, 60, 90, 120] as const;

// ── Shared sub-components ──────────────────────────────────────────────────

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'rgba(39,29,39,0.5)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        backdropFilter: 'blur(20px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  caption?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--accent-yellow)', display: 'inline-flex' }}>{icon}</span>
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--fg-primary)',
          letterSpacing: '0.01em',
        }}
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

function GridPreview({ size }: { size: number }) {
  const capped = Math.min(size, 30);
  const cellPx = Math.min(10, Math.floor(220 / capped));
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
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${capped}, ${cellPx}px)`,
            gap: 1,
          }}
        >
          {Array.from({ length: capped * capped }).map((_, i) => {
            const r = (i * 2654435761) % 100;
            const t = r < 12 ? 'red' : r < 24 ? 'blue' : 'empty';
            return (
              <div
                key={i}
                style={{
                  width: cellPx,
                  height: cellPx,
                  background:
                    t === 'red'
                      ? 'var(--team-red)'
                      : t === 'blue'
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
        {size} × {size} = {size * size} cells
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
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
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--fg-primary)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CreateRoom(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isTablet } = useWindowSize();
  const isNarrow = isMobile || isTablet;
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TEAM);
  const [gridSize, setGridSize] = useState(12);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const room = await roomService.createRoom({
        gameMode,
        gridSize,
        durationSeconds,
        maxPlayers,
      });
      useRoomStore
        .getState()
        .setRoom(room.code, { gameMode, gridSize, durationSeconds, maxPlayers });
      setCreatedCode(room.code);
    } catch {
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!createdCode) return;
    void navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  const maxSlots = gameMode === GameMode.TEAM ? 8 : 10;

  // ── Code reveal step ──────────────────────────────────────────────────────
  if (createdCode) {
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
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            padding: isMobile ? '16px 4px' : isTablet ? '32px 16px' : '80px 24px',
            textAlign: 'center',
            fontFamily: 'var(--font-ui)',
            boxSizing: 'border-box',
          }}
        >
          <p className="eyebrow" style={{ color: 'var(--accent-yellow)', marginBottom: 20 }}>
            Room Created
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 22 : isTablet ? 28 : 32,
              margin: 0,
              color: 'var(--fg-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Share this code with friends
          </h2>
          <p
            style={{
              color: 'var(--fg-tertiary)',
              fontSize: 13,
              marginTop: 10,
              marginBottom: 32,
            }}
          >
            They&apos;ll tap &quot;Join Room&quot; on the Zonite home and enter it.
          </p>

          <Panel style={{ padding: isMobile ? 16 : 32, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: isMobile ? 4 : 10,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              {createdCode.split('').map((ch, i) => (
                <div
                  key={i}
                  style={{
                    width: isMobile ? 38 : 56,
                    height: isMobile ? 52 : 72,
                    background: 'rgba(23,14,27,0.8)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? 26 : 38,
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
              <button
                type="button"
                onClick={copyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  color: copied ? 'var(--lime-300)' : 'var(--fg-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
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
            <SummaryItem label="Grid" value={`${gridSize}×${gridSize}`} />
            <SummaryItem label="Mode" value={gameMode === GameMode.SOLO ? 'Solo' : 'Red vs Blue'} />
            <SummaryItem label="Timer" value={`${durationSeconds}s`} />
            <SummaryItem label="Players" value={`up to ${maxPlayers}`} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setCreatedCode(null)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--fg-tertiary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
              }}
            >
              Edit Settings
            </button>
            <button
              type="button"
              onClick={() => navigate(`/lobby/${createdCode}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 8,
                background: 'var(--accent-yellow)',
                border: 'none',
                color: 'var(--ink-900)',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(253,235,86,0.35)',
                transition: 'all 140ms var(--ease-out)',
              }}
            >
              Enter Lobby <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Configure step ────────────────────────────────────────────────────────
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
          maxWidth: 880,
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '12px 4px' : isTablet ? '16px 12px' : '20px 24px',
          fontFamily: 'var(--font-ui)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => navigate('/home')}
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
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <p className="eyebrow">Create Room</p>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? 24 : isTablet ? 30 : 36,
            margin: '0 0 4px',
            letterSpacing: '-0.01em',
            color: 'var(--fg-primary)',
          }}
        >
          Configure Match
        </h1>
        <p style={{ color: 'var(--fg-tertiary)', fontSize: 14, marginBottom: 16 }}>
          Tune the board, mode, and timer. You&apos;ll get a 6-character code to share.
        </p>

        <div
          style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 12 }}
        >
          {/* Grid size + preview */}
          <Panel style={{ padding: isMobile ? 12 : 16, gridColumn: '1 / -1' }}>
            <SectionHeader
              icon={<LayoutGrid size={14} />}
              title="Grid Size"
              caption={`${gridSize * gridSize} total cells · always square`}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 240px',
                gap: isMobile ? 16 : 32,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
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
                    Board Size
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--accent-yellow)',
                    }}
                  >
                    {gridSize}
                    <span
                      style={{
                        color: 'var(--fg-muted)',
                        fontSize: 11,
                        marginLeft: 6,
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      × {gridSize}
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
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
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>
              <GridPreview size={gridSize} />
            </div>
          </Panel>

          {/* Game Mode */}
          <Panel style={{ padding: isMobile ? 12 : 16 }}>
            <SectionHeader icon={<Swords size={14} />} title="Game Mode" />
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}
            >
              {(
                [
                  {
                    mode: GameMode.SOLO,
                    icon: <Target size={18} />,
                    title: 'Solo',
                    desc: 'Free-for-all · every player a color',
                  },
                  {
                    mode: GameMode.TEAM,
                    icon: <Swords size={18} />,
                    title: 'Red vs Blue',
                    desc: 'Two teams · claim for your color',
                  },
                ] as const
              ).map(({ mode, icon, title, desc }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGameMode(mode)}
                  style={{
                    textAlign: 'left',
                    background:
                      gameMode === mode ? 'rgba(253,235,86,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${gameMode === mode ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    boxShadow: gameMode === mode ? '0 0 20px rgba(253,235,86,0.18)' : 'none',
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
                        color: gameMode === mode ? 'var(--accent-yellow)' : 'var(--fg-tertiary)',
                        display: 'inline-flex',
                      }}
                    >
                      {icon}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      {title}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--fg-tertiary)' }}>{desc}</span>
                </button>
              ))}
            </div>
          </Panel>

          {/* Time Limit */}
          <Panel style={{ padding: isMobile ? 12 : 16 }}>
            <SectionHeader icon={<Clock size={14} />} title="Time Limit" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 8,
                marginTop: 16,
              }}
            >
              {DURATION_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDurationSeconds(t)}
                  style={{
                    background:
                      durationSeconds === t ? 'rgba(253,235,86,0.12)' : 'rgba(255,255,255,0.02)',
                    color: durationSeconds === t ? 'var(--accent-yellow)' : 'var(--fg-secondary)',
                    border: `1px solid ${durationSeconds === t ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                    borderRadius: 8,
                    padding: '14px 0',
                    fontWeight: 800,
                    fontSize: 15,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    boxShadow: durationSeconds === t ? '0 0 16px rgba(253,235,86,0.25)' : 'none',
                    transition: 'all 140ms var(--ease-out)',
                  }}
                >
                  {t}s
                </button>
              ))}
            </div>
          </Panel>

          {/* Max Players */}
          <Panel style={{ padding: isMobile ? 12 : 16, gridColumn: '1 / -1' }}>
            <SectionHeader
              icon={<Users size={14} />}
              title="Max Players"
              caption={`${maxPlayers} slot${maxPlayers > 1 ? 's' : ''}`}
            />
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                style={stepBtnStyle}
              >
                <Minus size={14} />
              </button>
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${maxSlots}, 1fr)`,
                  gap: 6,
                }}
              >
                {Array.from({ length: maxSlots }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setMaxPlayers(Math.max(2, i + 1))}
                    style={{
                      height: 28,
                      borderRadius: 6,
                      background:
                        i < maxPlayers ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i < maxPlayers ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                      cursor: 'pointer',
                      transition: 'all 120ms var(--ease-out)',
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMaxPlayers(Math.min(maxSlots, maxPlayers + 1))}
                style={stepBtnStyle}
              >
                <Plus size={14} />
              </button>
            </div>
          </Panel>
        </div>

        {error && (
          <p style={{ color: 'var(--fire-red)', fontSize: 12, margin: '16px 0 0' }}>{error}</p>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/home')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--fg-tertiary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleCreate()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 8,
              background: loading ? 'var(--fg-faint)' : 'var(--accent-yellow)',
              border: 'none',
              color: loading ? 'var(--fg-muted)' : 'var(--ink-900)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 15,
              fontWeight: 700,
              boxShadow: loading ? 'none' : '0 0 20px rgba(253,235,86,0.35)',
              transition: 'all 140ms var(--ease-out)',
            }}
          >
            {loading ? 'Creating…' : 'Create Room'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </Shell>
  );
}

const stepBtnStyle: React.CSSProperties = {
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
  flexShrink: 0,
};
