import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { SocialRow } from '../../components/ui/SocialRow';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { LegalModal, type LegalKind } from '../../components/ui/LegalModal';
import { IconArrowRight, IconCheck, IconEye, IconEyeOff } from '../../components/common/icons';
import { authService } from '../../services/auth.service';

export default function Signup(): JSX.Element {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.length < 3) errs.name = 'At least 3 characters';
    if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 8) errs.password = 'At least 8 characters';
    if (!agree) errs.agree = 'Accept the terms to continue';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setApiError('');
    setLoading(true);
    try {
      await authService.register(email, password, name);
      navigate('/verify-otp', { state: { email, purpose: 'verify_email' } });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed';
      setApiError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      step="Create Account"
      title="Join the Grid"
      subtitle="Pick a handle, claim your first color, and get in a room in under a minute."
      hero={<MiniGridArt pattern="scatter" />}
    >
      <SocialRow />

      <div style={dividerStyle}>
        <div style={hrStyle} />
        <span style={{ whiteSpace: 'nowrap' }}>Or Email</span>
        <div style={hrStyle} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <Field
            label="Display Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((v) => ({ ...v, name: '' }));
            }}
            placeholder="KairosX"
            error={errors.name}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((v) => ({ ...v, email: '' }));
            }}
            placeholder="you@zonite.gg"
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Field
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((v) => ({ ...v, password: '' }));
            }}
            placeholder="At least 8 characters"
            error={errors.password}
            autoComplete="new-password"
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
          <PasswordStrength password={password} />
        </div>

        {/* Terms checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--fg-secondary)',
            marginBottom: 4,
            userSelect: 'none',
          }}
          onClick={() => {
            setAgree((v) => !v);
            setErrors((e) => ({ ...e, agree: '' }));
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 16,
              height: 16,
              marginTop: 2,
              borderRadius: 4,
              background: agree ? 'var(--accent-yellow)' : 'transparent',
              border: `1px solid ${agree ? 'var(--accent-yellow)' : errors.agree ? 'var(--fire-red)' : 'var(--border-default)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 140ms var(--ease-out)',
            }}
          >
            {agree && <IconCheck size={10} color="var(--ink-900)" strokeWidth={3} />}
          </div>
          <span>
            I agree to the{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLegalOpen('terms');
              }}
              style={legalLinkStyle}
            >
              Terms
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLegalOpen('privacy');
              }}
              style={legalLinkStyle}
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>
        {errors.agree && (
          <div
            style={{
              color: 'var(--fire-red)',
              fontSize: 11,
              marginBottom: 8,
              marginLeft: 24,
              fontWeight: 600,
            }}
          >
            {errors.agree}
          </div>
        )}

        <div style={{ height: 14 }} />

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
          {loading ? 'Creating…' : 'Create Account'}
        </Button>
      </form>

      <LegalModal
        open={legalOpen !== null}
        initialKind={legalOpen ?? 'terms'}
        onClose={() => setLegalOpen(null)}
        onAccept={() => {
          setAgree(true);
          setErrors((e) => ({ ...e, agree: '' }));
        }}
      />

      <p style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: 'var(--fg-tertiary)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          style={{
            color: 'var(--accent-yellow)',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Sign in
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
const showToggleStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--fg-tertiary)',
  cursor: 'pointer',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
};
const legalLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--accent-yellow)',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 'inherit',
  fontFamily: 'inherit',
  cursor: 'pointer',
};
