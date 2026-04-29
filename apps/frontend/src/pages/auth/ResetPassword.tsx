import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { IconArrowLeft, IconCheck, IconEye, IconEyeOff } from '../../components/common/icons';
import { authService } from '../../services/auth.service';

export default function ResetPassword(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (newPassword.length < 8) errs.password = 'At least 8 characters';
    if (newPassword !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setApiError('');
    setLoading(true);
    try {
      await authService.resetPassword(newPassword);
      // Logout to clear the temp/auth cookies, then send to login.
      try {
        await authService.logout();
      } catch {
        // ignore — we still want to send the user to /login
      }
      navigate('/login', { replace: true, state: stateEmail ? { email: stateEmail } : undefined });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Reset failed — try requesting a new code';
      setApiError(typeof msg === 'string' ? msg : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      step="Reset Password"
      title="Set a New Password"
      subtitle="Your identity has been verified. Choose a strong password for your account."
      hero={<MiniGridArt pattern="key" />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ marginBottom: 14 }}>
          <Field
            label="New Password"
            type={showPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
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
          <PasswordStrength password={newPassword} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Field
            label="Confirm Password"
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((v) => ({ ...v, confirm: '' }));
            }}
            placeholder="Re-enter your new password"
            error={errors.confirm}
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

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/forgot')}
            leadingIcon={<IconArrowLeft size={14} />}
          >
            Back
          </Button>
          <div style={{ flex: 1 }} />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            trailingIcon={loading ? undefined : <IconCheck size={14} />}
          >
            {loading ? 'Saving…' : 'Reset'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

const showToggleStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--fg-tertiary)',
  cursor: 'pointer',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
};
