import { useMemo } from 'react';

export interface PasswordStrengthInfo {
  score: number;
  label: string;
  color: string;
}

export function calcPasswordStrength(pw: string): PasswordStrengthInfo | null {
  if (!pw.length) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const colors = [
    'var(--fire-red)',
    'var(--fire-red)',
    'var(--orange-500)',
    'var(--lime-300)',
    'var(--lime-300)',
  ];
  return { score: s, label: labels[s]!, color: colors[s]! };
}

export function PasswordStrength({ password }: { password: string }): JSX.Element | null {
  const strength = useMemo(() => calcPasswordStrength(password), [password]);
  if (!password || !strength) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 100,
              background: i < strength.score ? strength.color : 'rgba(255,255,255,0.08)',
              transition: 'all 120ms var(--ease-out)',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: strength.color, fontWeight: 700 }}>{strength.label}</div>
    </div>
  );
}
