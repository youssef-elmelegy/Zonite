import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { OtpField } from '../../components/ui/OtpField';
import { Button } from '../../components/ui/Button';
import { IconArrowLeft, IconArrowRight } from '../../components/common/icons';
import { authService, type OtpPurpose } from '../../services/auth.service';

interface LocationState {
  email: string;
  purpose: OtpPurpose;
}

const CONFIG: Record<OtpPurpose, { step: string; title: string }> = {
  verify_email: { step: 'Verify Email', title: 'Check Your Inbox' },
  reset_password: { step: 'Verify Identity', title: 'Enter Your Code' },
};

export default function VerifyOtp(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard: if no email/purpose in state, go back to signup
  useEffect(() => {
    if (!state?.email || !state?.purpose) {
      navigate('/signup', { replace: true });
    }
  }, [state, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown((v) => {
          if (v <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  if (!state?.email || !state?.purpose) return <></>;

  const { email, purpose } = state;
  const cfg = CONFIG[purpose];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp, purpose);
      if (purpose === 'verify_email') {
        navigate('/home', { replace: true });
      } else {
        navigate('/reset', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired code';
      setError(typeof msg === 'string' ? msg : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await authService.sendOtp(email, purpose);
      setResendCooldown(60);
      setOtp('');
      setError('');
    } catch {
      setError('Failed to resend. Try again in a moment.');
    }
  }

  return (
    <AuthLayout
      step={cfg.step}
      title={cfg.title}
      subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
      hero={<MiniGridArt pattern="key" />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <OtpField
            label="Verification Code"
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setError('');
            }}
            onComplete={(v) => setOtp(v)}
          />
          {error && (
            <div style={{ color: 'var(--fire-red)', fontSize: 11, marginTop: 8, fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        {/* Resend row */}
        <p style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginBottom: 24 }}>
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? 'var(--fg-muted)' : 'var(--accent-yellow)',
              fontWeight: 700,
              cursor: resendCooldown > 0 ? 'default' : 'pointer',
              fontSize: 12,
              padding: 0,
            }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </p>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              navigate(purpose === 'verify_email' ? '/signup' : '/forgot', { replace: true })
            }
            leadingIcon={<IconArrowLeft size={14} />}
          >
            Back
          </Button>
          <div style={{ flex: 1 }} />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            trailingIcon={loading ? undefined : <IconArrowRight size={16} />}
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
