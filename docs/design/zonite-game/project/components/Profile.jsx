// Profile screen — stats, recent matches, settings, logout confirm.
function Profile({ user, onLogout, onEdit, stats }) {
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [tab, setTab] = React.useState('stats');

  const level = Math.floor((user.xp || 2480) / 500) + 1;
  const xpInLevel = (user.xp || 2480) % 500;
  const pct = (xpInLevel / 500) * 100;

  return (
    <div
      data-screen-label="06 Profile"
      style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 24px' }}
    >
      {/* Header */}
      <Panel style={{ padding: 0, overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
        <div
          style={{
            height: 120,
            background:
              'linear-gradient(135deg, rgba(188,90,215,0.4), rgba(247,23,86,0.3) 50%, rgba(253,235,86,0.2))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.6,
            }}
          />
        </div>
        <div
          style={{
            padding: '0 28px 24px',
            marginTop: -50,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--magenta-500),var(--fire-red))',
              border: '4px solid var(--ink-850)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 0 30px rgba(188,90,215,0.5)',
            }}
          >
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 240, paddingBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 34,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                }}
              >
                {user.name}
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'rgba(253,235,86,0.12)',
                  border: '1px solid var(--accent-yellow)',
                  borderRadius: 100,
                }}
              >
                <IconFlame size={12} stroke="var(--accent-yellow)" />
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--accent-yellow)',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                  }}
                >
                  LVL {level}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 6 }}>
              {user.email} · Joined {user.joined || 'Apr 2026'}
            </div>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: 'var(--fg-tertiary)',
                  marginBottom: 4,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>{xpInLevel} / 500 XP</span>
                <span>LVL {level + 1}</span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 100,
                  overflow: 'hidden',
                  maxWidth: 380,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'var(--accent-yellow)',
                    boxShadow: '0 0 12px rgba(253,235,86,0.5)',
                    transition: 'width 400ms var(--ease-out)',
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <Btn variant="secondary" size="sm" onClick={onEdit} icon={<IconSettings size={13} />}>
              Edit
            </Btn>
            <Btn
              variant="danger"
              size="sm"
              onClick={() => setConfirmLogout(true)}
              icon={<IconLogOut size={13} />}
            >
              Log Out
            </Btn>
          </div>
        </div>
      </Panel>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="Matches" value={stats.matches} icon={<IconGrid size={14} />} />
        <StatCard
          label="Wins"
          value={stats.wins}
          sub={`${Math.round((stats.wins / stats.matches) * 100)}% rate`}
          color="var(--lime-300)"
          icon={<IconTrophy size={14} />}
        />
        <StatCard
          label="Blocks Claimed"
          value={stats.blocks.toLocaleString()}
          color="var(--sky-300)"
          icon={<IconTarget size={14} />}
        />
        <StatCard
          label="Win Streak"
          value={stats.streak}
          color="var(--accent-yellow)"
          icon={<IconFlame size={14} />}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {[
          { k: 'stats', l: 'Recent Matches' },
          { k: 'settings', l: 'Settings' },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 20px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tab === t.k ? 'var(--accent-yellow)' : 'var(--fg-tertiary)',
              cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.k ? 'var(--accent-yellow)' : 'transparent'}`,
              marginBottom: -1,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          {stats.history.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto auto auto',
                gap: 16,
                alignItems: 'center',
                padding: '14px 20px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: m.won ? 'rgba(75,255,84,0.12)' : 'rgba(247,23,86,0.12)',
                  border: `1px solid ${m.won ? 'var(--lime-300)' : 'var(--fire-red)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.won ? 'var(--lime-300)' : 'var(--fire-red)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                }}
              >
                {m.won ? 'W' : 'L'}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>
                  {m.mode === 'team' ? 'Red vs Blue' : 'Solo'} · {m.size}×{m.size}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>
                  Room {m.code} · {m.ago}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--fg-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Blocks
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    marginTop: 2,
                  }}
                >
                  {m.blocks}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--fg-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  XP
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: m.won ? 'var(--lime-300)' : 'var(--fg-tertiary)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    marginTop: 2,
                  }}
                >
                  {m.won ? '+' : ''}
                  {m.xp}
                </div>
              </div>
              <IconChevronRight size={14} stroke="var(--fg-muted)" />
            </div>
          ))}
        </Panel>
      )}

      {tab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel style={{ padding: 20 }}>
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Account
            </h3>
            <SettingLine label="Email" value={user.email} />
            <SettingLine label="Display Name" value={user.name} />
            <SettingLine label="Password" value="••••••••" action="Change" />
            <SettingLine label="Two-factor" value="Off" action="Enable" last />
          </Panel>
          <Panel style={{ padding: 20 }}>
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Preferences
            </h3>
            <SettingLine label="Notifications" value="On" action="Toggle" />
            <SettingLine label="Sound Effects" value="On" action="Toggle" />
            <SettingLine label="Region" value="EU West" />
            <SettingLine label="Delete Account" value="" action="Delete" danger last />
          </Panel>
        </div>
      )}

      {confirmLogout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16,6,19,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--ink-850)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 28,
              maxWidth: 400,
              width: '100%',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(247,23,86,0.12)',
                  border: '1px solid var(--fire-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconLogOut size={18} stroke="var(--fire-red)" />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Log out?
              </h3>
            </div>
            <p
              style={{
                color: 'var(--fg-tertiary)',
                fontSize: 13,
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              You'll be signed out on this device. Your stats and streak stay safe.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setConfirmLogout(false)}>
                Cancel
              </Btn>
              <Btn variant="danger" onClick={onLogout} icon={<IconLogOut size={14} />}>
                Log Out
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color = '#fff', icon }) {
  return (
    <div
      style={{
        background: 'rgba(39,29,39,0.5)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          color: 'var(--fg-tertiary)',
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 700,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color,
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SettingLine({ label, value, action, danger, last }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--fg-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 3,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, color: danger ? 'var(--fire-red)' : '#fff', fontWeight: 600 }}>
          {value}
        </div>
      </div>
      {action && (
        <button
          style={{
            background: danger ? 'rgba(247,23,86,0.12)' : 'transparent',
            color: danger ? 'var(--fire-red)' : 'var(--accent-yellow)',
            border: `1px solid ${danger ? 'var(--fire-red)' : 'var(--border-default)'}`,
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

window.Profile = Profile;
