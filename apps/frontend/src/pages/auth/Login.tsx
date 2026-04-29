import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { SocialRow } from '../../components/ui/SocialRow';
import { IconArrowRight, IconCheck, IconEye, IconEyeOff } from '../../components/common/icons';
import { authService } from '../../services/auth.service';

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password too short';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setApiError('');
    setLoading(true);
    try {
      await authService.login(email, password);
      navigate('/home');
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response;
      const msg = resp?.data?.message ?? 'Invalid email or password';

      if (
        resp?.status === 403 &&
        typeof msg === 'string' &&
        msg.toLowerCase().includes('email not verified')
      ) {
        // Redirect to verify page and prefill email
        navigate('/verify-otp', { state: { email, purpose: 'verify_email' } });
        return;
      }

      setApiError(typeof msg === 'string' ? msg : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      step="Sign In"
      title="Welcome Back"
      subtitle="Pick up your streak right where you left it."
      hero={<MiniGridArt pattern="split" />}
    >
      <SocialRow />

      <div style={dividerStyle}>
        <div style={hrStyle} />
        <span style={dividerTextStyle}>Or Email</span>
        <div style={hrStyle} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((v) => ({ ...v, email: undefined }));
            }}
            placeholder="you@zonite.gg"
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <Field
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((v) => ({ ...v, password: undefined }));
            }}
            placeholder="••••••••"
            error={errors.password}
            autoComplete="current-password"
            right={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={showToggleStyle}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            }
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <label style={rememberLabelStyle} onClick={() => setRemember((v) => !v)}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                flexShrink: 0,
                background: remember ? 'var(--accent-yellow)' : 'transparent',
                border: `1px solid ${remember ? 'var(--accent-yellow)' : 'var(--border-default)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 140ms var(--ease-out)',
              }}
            >
              {remember && <IconCheck size={10} color="var(--ink-900)" strokeWidth={3} />}
            </div>
            Remember me
          </label>
          <Link to="/forgot" style={forgotStyle}>
            Forgot password?
          </Link>
        </div>

        {apiError && (
          <p
            style={{
              color: 'var(--fire-red)',
              fontSize: 'var(--fs-sm)',
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            {apiError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          trailingIcon={loading ? undefined : <IconArrowRight size={16} />}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p style={switchStyle}>
        New to Zonite?{' '}
        <Link to="/signup" style={linkStyle}>
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

const dividerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '20px 0',
  fontSize: 10,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
};
const hrStyle: React.CSSProperties = { flex: 1, height: 1, background: 'var(--border-subtle)' };
const dividerTextStyle: React.CSSProperties = { whiteSpace: 'nowrap' };
const showToggleStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--fg-tertiary)',
  cursor: 'pointer',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
};
const rememberLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontSize: 12,
  color: 'var(--fg-secondary)',
  userSelect: 'none',
};
const forgotStyle: React.CSSProperties = {
  color: 'var(--accent-yellow)',
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none',
};
const switchStyle: React.CSSProperties = {
  marginTop: 22,
  textAlign: 'center',
  fontSize: 13,
  color: 'var(--fg-tertiary)',
};
const linkStyle: React.CSSProperties = {
  color: 'var(--accent-yellow)',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};
