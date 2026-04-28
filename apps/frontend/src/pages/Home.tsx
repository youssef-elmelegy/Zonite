import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shell } from '../components/layout/Shell';
import { PlayerChip } from '../components/common/PlayerChip';
import { useAuth } from '../hooks/useAuth';
import { useWindowSize } from '../hooks/useWindowSize';
import { profileService } from '../services/profile.service';
import styles from './Home.module.css';

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}): JSX.Element {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          marginBottom: 6,
          fontFamily: 'var(--font-ui)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color,
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useWindowSize();
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', 'info'],
    queryFn: () => profileService.getProfileInfo(),
    retry: false,
    enabled: !!user,
  });

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 6) {
      setCodeError('Room code must be 6 characters');
      return;
    }
    setCodeError('');
    navigate(`/lobby/${c}`);
  }

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Player';

  return (
    <Shell
      onHome={() => navigate('/home')}
      right={
        user ? (
          <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
            {profile && (
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
                  {profile.xp.toLocaleString()}
                </span>
                <span style={{ color: 'var(--fg-tertiary)', letterSpacing: '0.1em' }}>XP</span>
              </div>
            )}
            <PlayerChip
              playerName={displayName}
              team="neutral"
              onClick={() => navigate('/profile')}
            />
          </div>
        ) : undefined
      }
    >
      {/* Full-height hero — CSS module handles responsive margin/padding */}
      <div className={styles.hero}>
        {/* Isometric grid decoration — hidden on mobile via CSS module */}
        <div className={styles.isoGrid}>
          {Array.from({ length: 36 }).map((_, i) => {
            const reds = [2, 8, 9, 14, 20, 21, 26, 32];
            const blues = [4, 5, 11, 17, 22, 23, 28, 29];
            const st = reds.includes(i) ? 'red' : blues.includes(i) ? 'blue' : 'empty';
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  background:
                    st === 'red'
                      ? 'var(--team-red)'
                      : st === 'blue'
                        ? 'var(--team-blue)'
                        : 'rgba(255,255,255,0.04)',
                  border:
                    '1px solid ' + (st === 'empty' ? 'rgba(255,255,255,0.06)' : 'transparent'),
                  boxShadow:
                    st === 'red'
                      ? '0 0 14px rgba(247,23,86,0.35)'
                      : st === 'blue'
                        ? '0 0 14px rgba(55,234,246,0.35)'
                        : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Hero content */}
        <div style={{ maxWidth: 640, width: '100%', position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ marginBottom: 24, color: 'var(--fire-pink)' }}>
            Real-Time Claim Grid
          </p>

          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 7vw, 96px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: 'var(--fg-primary)',
            }}
          >
            CLAIM YOUR
            <br />
            <span
              style={{
                background: 'var(--grad-fire)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              TERRITORY
            </span>
          </h1>

          <p
            style={{
              color: 'var(--fg-tertiary)',
              fontSize: 16,
              lineHeight: 1.55,
              marginTop: 16,
              marginBottom: joining ? 16 : 28,
              maxWidth: 480,
            }}
          >
            Block-by-block, second-by-second. Assemble your squad, fill the board, and take the
            round before the clock hits zero.
          </p>

          {!joining ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/create')}
                style={{
                  background: 'var(--accent-yellow)',
                  color: 'var(--ink-900)',
                  border: '1px solid var(--accent-yellow)',
                  borderRadius: 8,
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-ui)',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 0 24px rgba(253,235,86,0.35)',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                + Create Room
              </button>
              <button
                onClick={() => setJoining(true)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--fg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'var(--font-ui)',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                ↗ Join Room
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleJoinSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxWidth: 480,
                width: '100%',
              }}
            >
              <p className="eyebrow" style={{ color: 'var(--accent-yellow)', marginBottom: 4 }}>
                Enter Room Code
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 10,
                  alignItems: 'stretch',
                  width: '100%',
                }}
              >
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().slice(0, 6));
                    setCodeError('');
                  }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    width: '100%',
                    background: 'rgba(23,14,27,0.8)',
                    border: `1px solid ${codeError ? 'var(--fire-red)' : 'var(--border-default)'}`,
                    borderRadius: 8,
                    padding: '14px 16px',
                    fontSize: 'clamp(20px, 5vw, 28px)',
                    fontWeight: 800,
                    color: 'var(--fg-primary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--accent-yellow)',
                    color: 'var(--ink-900)',
                    border: '1px solid var(--accent-yellow)',
                    borderRadius: 8,
                    padding: isMobile ? '14px 20px' : '16px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: 'var(--font-ui)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  Join →
                </button>
              </div>
              {codeError && (
                <div style={{ color: 'var(--fire-red)', fontSize: 12, fontWeight: 600 }}>
                  {codeError}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setJoining(false);
                  setCode('');
                  setCodeError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-tertiary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                  marginTop: 4,
                  fontFamily: 'var(--font-ui)',
                }}
              >
                ← Back
              </button>
            </form>
          )}

          {!joining && (
            <div style={{ marginTop: 32, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <MiniStat
                label="My Matches"
                value={profile ? profile.totalMatchesPlayed.toLocaleString() : '—'}
                color="var(--lime-300)"
              />
              <MiniStat
                label="Wins"
                value={profile ? profile.totalWins.toLocaleString() : '—'}
                color="var(--sky-300)"
              />
              <MiniStat label="Season" value="S1" color="var(--accent-yellow)" />
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
