import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt } from '../../components/common/MiniGridArt';
import { Button } from '../../components/ui/Button';
import { DateOfBirthInput } from '../../components/ui/DateOfBirthInput';
import {
  IconArrowRight,
  IconCamera,
  IconSkipForward,
  IconUser,
} from '../../components/common/icons';
import { authService } from '../../services/auth.service';

export default function SetupProfile(): JSX.Element {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dob, setDob] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState('');

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await authService.uploadImage(file);
      setImageUrl(url);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Image upload failed';
      setError(typeof msg === 'string' ? msg : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dob) {
      setError('Date of birth is required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authService.setupProfile({
        dateOfBirth: dob,
        profileImage: imageUrl || undefined,
      });
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save profile';
      setError(typeof msg === 'string' ? msg : 'Could not save profile');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setError('');
    setSkipping(true);
    try {
      await authService.logout();
    } catch {
      // ignore — still navigate to login
    } finally {
      setSkipping(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <AuthLayout
      step="Complete Profile"
      title="One Last Step"
      subtitle="Pick an avatar and tell us your date of birth so we can personalize your Zonite."
      hero={<MiniGridArt pattern="scatter" />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Avatar uploader */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Upload profile image"
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: imageUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(188,90,215,0.25), rgba(247,23,86,0.18))',
                border: `2px dashed ${imageUrl ? 'transparent' : 'var(--border-default)'}`,
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'var(--fg-tertiary)',
                transition: 'all 160ms var(--ease-out)',
                padding: 0,
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : uploading ? (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.18)',
                    borderTopColor: 'var(--accent-yellow)',
                    animation: 'zspin 700ms linear infinite',
                  }}
                />
              ) : (
                <IconUser size={42} />
              )}
            </button>
            <span
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-yellow)',
                border: '2px solid var(--ink-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <IconCamera size={15} color="var(--ink-900)" />
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => void handleImageChange(e)}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <p
          style={{
            margin: '0 0 22px',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--fg-tertiary)',
          }}
        >
          Tap the circle to upload a profile picture
        </p>

        {/* DOB */}
        <div style={{ marginBottom: 18 }}>
          <label style={fieldLabel}>Date of Birth</label>
          <DateOfBirthInput value={dob} onChange={setDob} />
        </div>

        {error && (
          <p
            style={{
              color: 'var(--fire-red)',
              fontSize: 'var(--fs-sm)',
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleSkip()}
            loading={skipping}
            leadingIcon={skipping ? undefined : <IconSkipForward size={14} />}
          >
            Skip
          </Button>
          <div style={{ flex: 1 }} />
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!dob || uploading}
            trailingIcon={submitting ? undefined : <IconArrowRight size={16} />}
          >
            {submitting ? 'Saving…' : 'Finish'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--fg-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  fontWeight: 700,
  marginBottom: 8,
};
