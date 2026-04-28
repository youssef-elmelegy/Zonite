import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { MiniGridArt, GridPattern } from '../../components/common/MiniGridArt';
import { Button } from '../../components/ui/Button';
import { IconArrowLeft, IconArrowRight } from '../../components/common/icons';
import { useAuthStore } from '../../store/auth.store';

const STEPS: { kicker: string; title: string; body: string; art: GridPattern }[] = [
  {
    kicker: 'How it works',
    title: 'Claim Territory',
    body: 'Tap cells faster than your rivals. The board fills one block at a time — and only the quickest take ground.',
    art: 'scatter',
  },
  {
    kicker: 'Two ways to play',
    title: 'Play Solo or Squad',
    body: 'Free-for-all with every player a color, or Red vs Blue team matches where every claim feeds your side.',
    art: 'split',
  },
  {
    kicker: 'Quick to start',
    title: 'Invite with a Code',
    body: 'Every room has a 6-character code. Share it, hit Ready, and let the clock drop.',
    art: 'key',
  },
];

export default function Onboarding(): JSX.Element {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const s = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function finish() {
    setOnboarded();
    navigate('/signup');
  }

  return (
    <AuthLayout
      step={s.kicker}
      title={s.title}
      subtitle={s.body}
      hero={<MiniGridArt pattern={s.art} />}
    >
      {/* Progress bars */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 100,
              background: idx <= step ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.08)',
              transition: 'all 200ms var(--ease-out)',
              boxShadow: idx === step ? '0 0 10px rgba(253,235,86,0.6)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Nav row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {step > 0 && (
          <Button
            variant="ghost"
            onClick={() => setStep((n) => n - 1)}
            leadingIcon={<IconArrowLeft size={14} />}
          >
            Back
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <Button variant="ghost" onClick={finish}>
          Skip
        </Button>
        <Button
          variant="primary"
          onClick={isLast ? finish : () => setStep((n) => n + 1)}
          trailingIcon={<IconArrowRight size={14} />}
        >
          {isLast ? 'Get Started' : 'Next'}
        </Button>
      </div>
    </AuthLayout>
  );
}
