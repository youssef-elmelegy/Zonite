import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shell } from '../components/layout/Shell';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import type { MatchRecord } from '../services/profile.service';
import styles from './Profile.module.css';

// ── Sub-components ─────────────────────────────────────────────────────────────

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(23,14,27,0.8)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 14,
  color: 'var(--fg-primary)',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  flex: 1,
  width: '100%',
};

function DateSelectInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const [y, m, d] = value ? value.split('-') : ['', '', ''];

  function emit(year: string, month: string, day: string) {
    if (year && month && day) onChange(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    else onChange('');
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ position: 'relative', flex: 2 }}>
        <select
          value={m ? String(parseInt(m)) : ''}
          onChange={(e) => emit(y, e.target.value, d)}
          style={SELECT_STYLE}
        >
          <option value="" disabled style={{ background: 'var(--ink-850)' }}>
            Month
          </option>
          {months.map((name, i) => (
            <option key={name} value={String(i + 1)} style={{ background: 'var(--ink-850)' }}>
              {name}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <select
          value={d ? String(parseInt(d)) : ''}
          onChange={(e) => emit(y, m, e.target.value)}
          style={SELECT_STYLE}
        >
          <option value="" disabled style={{ background: 'var(--ink-850)' }}>
            Day
          </option>
          {days.map((day) => (
            <option key={day} value={day} style={{ background: 'var(--ink-850)' }}>
              {day}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </div>
      <div style={{ position: 'relative', flex: 1.5 }}>
        <select value={y ?? ''} onChange={(e) => emit(e.target.value, m, d)} style={SELECT_STYLE}>
          <option value="" disabled style={{ background: 'var(--ink-850)' }}>
            Year
          </option>
          {years.map((year) => (
            <option key={year} value={year} style={{ background: 'var(--ink-850)' }}>
              {year}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </div>
    </div>
  );
}

function ChevronIcon(): JSX.Element {
  return (
    <svg
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--fg-tertiary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }): JSX.Element {
  return open ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): JSX.Element {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(23,14,27,0.8)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '12px 44px 12px 16px',
            fontSize: 14,
            color: 'var(--fg-primary)',
            fontFamily: 'var(--font-ui)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--fg-tertiary)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = 'var(--fg-primary)',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}): JSX.Element {
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

function SettingLine({
  label,
  value,
  action,
  danger,
  last,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  action?: string;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}): JSX.Element {
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
        <div
          style={{
            fontSize: 13,
            color: danger ? 'var(--fire-red)' : 'var(--fg-primary)',
            fontWeight: 600,
          }}
        >
          {value}
        </div>
      </div>
      {action && (
        <button
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          style={{
            background: danger ? 'rgba(247,23,86,0.12)' : 'transparent',
            color: disabled
              ? 'var(--fg-muted)'
              : danger
                ? 'var(--fire-red)'
                : 'var(--accent-yellow)',
            border: `1px solid ${disabled ? 'var(--border-subtle)' : danger ? 'var(--fire-red)' : 'var(--border-default)'}`,
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            cursor: disabled ? 'default' : 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function MatchRow({ match, index }: { match: MatchRecord; index: number }): JSX.Element {
  const ago = (() => {
    const diff = Date.now() - new Date(match.playedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div
      className={styles.matchRow}
      style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: match.won ? 'rgba(75,255,84,0.12)' : 'rgba(247,23,86,0.12)',
          border: `1px solid ${match.won ? 'var(--lime-300)' : 'var(--fire-red)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: match.won ? 'var(--lime-300)' : 'var(--fire-red)',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          fontSize: 14,
        }}
      >
        {match.won ? 'W' : 'L'}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--fg-primary)', fontWeight: 700 }}>
          {match.mode === 'TEAM' ? 'Red vs Blue' : 'Solo'} · {match.gridSize}×{match.gridSize}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {match.roomCode ? `Room ${match.roomCode}` : 'Room —'} · {ago}
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
            color: 'var(--fg-primary)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginTop: 2,
          }}
        >
          {match.blocksClaimed}
        </div>
      </div>
      <div className={styles.matchRowXp}>
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
            color: match.won ? 'var(--lime-300)' : 'var(--fg-tertiary)',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            marginTop: 2,
          }}
        >
          {match.won ? '+' : ''}
          {match.xpEarned}
        </div>
      </div>
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(23,14,27,0.8)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 14,
  color: 'var(--fg-primary)',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
};

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--fg-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  fontWeight: 700,
  marginBottom: 8,
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Profile(): JSX.Element {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'stats' | 'settings'>('stats');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [editForm, setEditForm] = useState({ fullName: '', dateOfBirth: '' });
  const [newEmail, setNewEmail] = useState('');
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'info'],
    queryFn: () => profileService.getProfileInfo(),
    retry: false,
  });

  const {
    data: matchPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['profile', 'matches'],
    queryFn: ({ pageParam }) => profileService.getMatchRecords(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    retry: false,
  });
  const matches = matchPages?.pages.flatMap((p) => p.items) ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateInfoMutation = useMutation({
    mutationFn: (dto: { fullName?: string; dateOfBirth?: string }) =>
      profileService.updateProfileInfo(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'info'] });
      setEditInfoOpen(false);
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: (email: string) => profileService.updateEmail(email),
    onSuccess: async (_data, emailArg) => {
      setEditEmailOpen(false);
      // Logout and redirect to verify OTP for the new email
      await authService.logout();
      navigate('/verify-otp', { state: { email: emailArg, purpose: 'verify_email' } });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setChangePasswordOpen(false);
      setPwForm({ oldPassword: '', newPassword: '' });
      setPwError('');
    },
    onError: () => {
      setPwError('Incorrect current password or server error. Please try again.');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });

  // ── Image upload ───────────────────────────────────────────────────────────
  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url } = await profileService.uploadProfileImage(file);
      await profileService.updateProfileInfo({ profileImage: url });
      void queryClient.invalidateQueries({ queryKey: ['profile', 'info'] });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authService.logout();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
      navigate('/login');
    }
  }

  // ── Change password submit ─────────────────────────────────────────────────
  function handleChangePassword() {
    setPwError('');
    if (!pwForm.oldPassword) {
      setPwError('Enter your current password.');
      return;
    }
    const pw = pwForm.newPassword;
    if (pw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(pw)) {
      setPwError('New password must contain an uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(pw)) {
      setPwError('New password must contain a lowercase letter.');
      return;
    }
    if (!/\d/.test(pw)) {
      setPwError('New password must contain a number.');
      return;
    }
    void changePasswordMutation.mutateAsync(pwForm);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const displayName = profile?.fullName || user?.fullName || user?.email?.split('@')[0] || '?';
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const xpInLevel = xp % 500;
  const xpPct = (xpInLevel / 500) * 100;
  const winRate =
    profile && profile.totalMatchesPlayed > 0
      ? Math.round((profile.totalWins / profile.totalMatchesPlayed) * 100)
      : 0;
  const joinedYear = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <Shell onHome={() => navigate('/home')}>
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <Loader.Inline size="lg" label="Loading profile" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell onHome={() => navigate('/home')}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        {/* ── Profile header banner ── */}
        <div
          style={{
            background: 'rgba(39,29,39,0.55)',
            backdropFilter: 'blur(40px)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 0,
            overflow: 'hidden',
            marginBottom: 20,
            position: 'relative',
          }}
        >
          {/* Cover gradient */}
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
              padding: '0 20px 20px',
              marginTop: -50,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar + camera upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: profile?.profileImage
                    ? 'transparent'
                    : 'linear-gradient(135deg,var(--magenta-500),var(--fire-red))',
                  border: '4px solid var(--ink-850)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  fontWeight: 800,
                  color: 'var(--fg-primary)',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 0 30px rgba(188,90,215,0.5)',
                  overflow: 'hidden',
                }}
              >
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  displayName[0].toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                title="Upload profile photo"
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: uploadingImage ? 'var(--ink-700)' : 'var(--accent-yellow)',
                  border: '2px solid var(--ink-850)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  transition: 'all 140ms var(--ease-out)',
                }}
              >
                {uploadingImage ? (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'var(--fg-primary)',
                      animation: 'zspin 700ms linear infinite',
                    }}
                  />
                ) : (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ink-900)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => void handleImageFile(e)}
                style={{ display: 'none' }}
              />
            </div>

            {/* Name + level + XP */}
            <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(22px, 4vw, 34px)',
                    color: 'var(--fg-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {displayName}
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
                {profile?.email} · Joined {joinedYear}
              </div>
              <div style={{ marginTop: 10, maxWidth: 380 }}>
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
                  }}
                >
                  <div
                    style={{
                      width: `${xpPct}%`,
                      height: '100%',
                      background: 'var(--accent-yellow)',
                      boxShadow: '0 0 12px rgba(253,235,86,0.5)',
                      transition: 'width 400ms var(--ease-out)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Header actions */}
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <button
                onClick={() => {
                  setEditForm({
                    fullName: profile?.fullName ?? '',
                    dateOfBirth: profile?.dateOfBirth ?? '',
                  });
                  setEditInfoOpen(true);
                }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--fg-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-ui)',
                  cursor: 'pointer',
                }}
              >
                ✎ Edit
              </button>
              <button
                onClick={() => setSignOutOpen(true)}
                style={{
                  background: 'rgba(247,23,86,0.12)',
                  color: 'var(--fire-red)',
                  border: '1px solid var(--fire-red)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-ui)',
                  cursor: 'pointer',
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className={styles.statsGrid}>
          <StatCard label="Matches" value={profile?.totalMatchesPlayed ?? 0} />
          <StatCard
            label="Wins"
            value={profile?.totalWins ?? 0}
            sub={`${winRate}% rate`}
            color="var(--lime-300)"
          />
          <StatCard
            label="Blocks Claimed"
            value={profile ? profile.totalBlocksMined.toLocaleString() : '0'}
            color="var(--sky-300)"
          />
          <StatCard
            label="Win Streak"
            value={profile?.currentWinStreak ?? 0}
            color="var(--accent-yellow)"
          />
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 16,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {(
            [
              { k: 'stats', l: 'Recent Matches' },
              { k: 'settings', l: 'Settings' },
            ] as const
          ).map((t) => (
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

        {/* ── Match history ── */}
        {tab === 'stats' && (
          <div
            style={{
              background: 'rgba(39,29,39,0.55)',
              backdropFilter: 'blur(40px)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {matches.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--fg-tertiary)',
                  fontSize: 13,
                }}
              >
                No matches yet. Create or join a room to start playing!
              </div>
            ) : (
              <div
                className={styles.matchesScroll}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (
                    hasNextPage &&
                    !isFetchingNextPage &&
                    el.scrollHeight - el.scrollTop - el.clientHeight < 120
                  ) {
                    void fetchNextPage();
                  }
                }}
              >
                {matches.map((m, i) => (
                  <MatchRow key={m.id} match={m} index={i} />
                ))}
                {hasNextPage && (
                  <div
                    style={{
                      padding: 16,
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      onClick={() => void fetchNextPage()}
                      disabled={isFetchingNextPage}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                        padding: '8px 24px',
                        color: 'var(--fg-tertiary)',
                        cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 700,
                      }}
                    >
                      {isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
                {!hasNextPage && matches.length > 0 && (
                  <div
                    style={{
                      padding: 12,
                      textAlign: 'center',
                      color: 'var(--fg-tertiary)',
                      fontSize: 11,
                      borderTop: '1px solid var(--border-subtle)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    End of history
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <div className={styles.settingsGrid}>
            {/* Account panel */}
            <div
              style={{
                background: 'rgba(39,29,39,0.55)',
                backdropFilter: 'blur(40px)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 20,
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-primary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Account
              </h3>
              <SettingLine
                label="Email"
                value={profile?.email ?? '—'}
                action="Change"
                onClick={() => {
                  setNewEmail('');
                  setEditEmailOpen(true);
                }}
              />
              <SettingLine
                label="Display Name"
                value={profile?.fullName ?? '—'}
                action="Change"
                onClick={() => {
                  setEditForm({
                    fullName: profile?.fullName ?? '',
                    dateOfBirth: profile?.dateOfBirth ?? '',
                  });
                  setEditInfoOpen(true);
                }}
              />
              <SettingLine
                label="Date of Birth"
                value={profile?.dateOfBirth || '—'}
                action="Change"
                onClick={() => {
                  setEditForm({
                    fullName: profile?.fullName ?? '',
                    dateOfBirth: profile?.dateOfBirth ?? '',
                  });
                  setEditInfoOpen(true);
                }}
              />
              <SettingLine
                label="Password"
                value="••••••••"
                action="Change"
                onClick={() => {
                  setPwForm({ oldPassword: '', newPassword: '' });
                  setPwError('');
                  setChangePasswordOpen(true);
                }}
                last
              />
            </div>

            {/* Danger zone panel */}
            <div
              style={{
                background: 'rgba(39,29,39,0.55)',
                backdropFilter: 'blur(40px)',
                border: '1px solid var(--border-default)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 20,
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-primary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Danger Zone
              </h3>
              <SettingLine label="Account Status" value="Active" />
              <SettingLine
                label="Email Verified"
                value={profile?.isEmailVerified ? 'Yes ✓' : 'No — check your inbox'}
              />
              <SettingLine label="Total XP" value={profile ? profile.xp.toLocaleString() : '0'} />
              <SettingLine
                label="Delete Account"
                value="Permanently remove your data"
                action="Delete"
                danger
                last
                onClick={() => setDeleteOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ══ Modals ══════════════════════════════════════════════════════════════ */}

      {/* Edit profile info */}
      <Modal
        open={editInfoOpen}
        title="Edit Profile"
        onClose={() => setEditInfoOpen(false)}
        action={
          <Button
            variant="primary"
            onClick={() =>
              void updateInfoMutation.mutateAsync({
                fullName: editForm.fullName || undefined,
                dateOfBirth: editForm.dateOfBirth || undefined,
              })
            }
            loading={updateInfoMutation.isPending}
          >
            Save Changes
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={FIELD_LABEL}>Display Name</label>
            <input
              autoFocus
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Your name"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={FIELD_LABEL}>Date of Birth</label>
            <DateSelectInput
              value={editForm.dateOfBirth}
              onChange={(v) => setEditForm((f) => ({ ...f, dateOfBirth: v }))}
            />
          </div>
          {updateInfoMutation.isError && (
            <p style={{ color: 'var(--fire-red)', fontSize: 12, margin: 0 }}>
              Failed to update profile. Please try again.
            </p>
          )}
        </div>
      </Modal>

      {/* Change email — success redirects to verify-otp */}
      <Modal
        open={editEmailOpen}
        title="Change Email"
        onClose={() => setEditEmailOpen(false)}
        action={
          <Button
            variant="primary"
            onClick={() => void updateEmailMutation.mutateAsync(newEmail)}
            loading={updateEmailMutation.isPending}
          >
            Send OTP
          </Button>
        }
      >
        <p style={{ color: 'var(--fg-secondary)', fontSize: 13, margin: '0 0 16px' }}>
          A verification OTP will be sent to the new address. You&apos;ll be logged out and asked to
          verify it.
        </p>
        <input
          autoFocus
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
          placeholder="new@email.com"
          style={INPUT_STYLE}
        />
        {updateEmailMutation.isError && (
          <p style={{ color: 'var(--fire-red)', fontSize: 12, margin: '8px 0 0' }}>
            Failed. Email may already be in use.
          </p>
        )}
      </Modal>

      {/* Change password */}
      <Modal
        open={changePasswordOpen}
        title="Change Password"
        onClose={() => {
          setChangePasswordOpen(false);
          setPwError('');
        }}
        action={
          <Button
            variant="primary"
            onClick={handleChangePassword}
            loading={changePasswordMutation.isPending}
          >
            Update Password
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PasswordField
            label="Current Password"
            value={pwForm.oldPassword}
            onChange={(v) => {
              setPwForm((f) => ({ ...f, oldPassword: v }));
              setPwError('');
            }}
            placeholder="Your current password"
          />
          <PasswordField
            label="New Password"
            value={pwForm.newPassword}
            onChange={(v) => {
              setPwForm((f) => ({ ...f, newPassword: v }));
              setPwError('');
            }}
            placeholder="Min 8 chars, A-Z, a-z, 0-9"
          />
          {pwError && (
            <p style={{ color: 'var(--fire-red)', fontSize: 12, margin: 0 }}>{pwError}</p>
          )}
          {changePasswordMutation.isSuccess && (
            <p style={{ color: 'var(--lime-300)', fontSize: 12, margin: 0 }}>
              Password updated successfully!
            </p>
          )}
        </div>
      </Modal>

      {/* Sign out */}
      <Modal
        open={signOutOpen}
        title="Log out?"
        onClose={() => setSignOutOpen(false)}
        action={
          <Button variant="primary" onClick={() => void handleSignOut()} loading={signingOut}>
            Log Out
          </Button>
        }
      >
        <p style={{ color: 'var(--fg-secondary)', margin: 0 }}>
          You&apos;ll be signed out on this device. Your stats and streak stay safe.
        </p>
      </Modal>

      {/* Delete account */}
      <Modal
        open={deleteOpen}
        title="Delete account?"
        onClose={() => setDeleteOpen(false)}
        action={
          <Button
            variant="primary"
            onClick={() => void deleteAccountMutation.mutateAsync()}
            loading={deleteAccountMutation.isPending}
          >
            Delete Forever
          </Button>
        }
      >
        <p style={{ color: 'var(--fg-secondary)', margin: 0 }}>
          This is permanent. Your account, stats, and match history will be erased immediately and
          cannot be recovered.
        </p>
      </Modal>
    </Shell>
  );
}
