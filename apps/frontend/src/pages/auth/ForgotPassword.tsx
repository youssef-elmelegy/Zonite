import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { IconArrowLeft, IconArrowRight } from '../../components/common/icons';
import { authService } from '../../services/auth.service';

export default function ForgotPassword(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(email, 'reset_password');
      navigate('/verify-otp', { state: { email, purpose: 'reset_password' } });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to send code';
      setError(typeof msg === 'string' ? msg : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      step="Forgot Password"
      title="Reset Password"
      subtitle="Enter the email tied to your Zonite account. We'll send a 6-digit verification code."
      hero={<MiniGridArt pattern="key" />}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@zonite.gg"
            error={error}
            autoComplete="email"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" type="button" leadingIcon={<IconArrowLeft size={14} />}>
              Back
            </Button>
          </Link>
          <div style={{ flex: 1 }} />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            trailingIcon={loading ? undefined : <IconArrowRight size={14} />}
          >
            {loading ? 'Sending…' : 'Send Code'}
          </Button>
        </div>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--fg-tertiary)' }}>
        Remembered it?{' '}
        <Link
          to="/login"
          style={{ color: 'var(--accent-yellow)', fontWeight: 700, textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
