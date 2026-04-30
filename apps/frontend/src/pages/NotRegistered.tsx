import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Shell } from '../components/layout/Shell';

export default function NotRegistered(): JSX.Element {
  const navigate = useNavigate();

  return (
    <Shell onHome={() => navigate('/home')}>
      <div
        className="fade-in"
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: '64px 24px',
          textAlign: 'center',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(255, 90, 90, 0.12)',
            border: '1px solid rgba(255, 90, 90, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <ShieldAlert size={32} color="var(--team-red, #ff5a5a)" />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--fg-primary)',
            margin: '0 0 12px',
            letterSpacing: '0.02em',
          }}
        >
          You are not registered to this match
        </h1>
        <p
          style={{
            color: 'var(--fg-tertiary)',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          This match is part of a YalGamers tournament and only registered players can join. If you
          believe this is a mistake, please check your tournament dashboard or contact the
          organizer.
        </p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 22px',
            borderRadius: 8,
            background: 'var(--accent-yellow)',
            border: 'none',
            color: 'var(--ink-900)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    </Shell>
  );
}
