import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export type LegalKind = 'terms' | 'privacy';

interface LegalModalProps {
  open: boolean;
  initialKind?: LegalKind;
  onClose: () => void;
  onAccept?: () => void;
}

const PLACEHOLDER_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vehicula tortor at urna pulvinar, eu pharetra ipsum tempus. Curabitur dignissim, augue nec hendrerit blandit, dolor lacus posuere felis, vitae aliquet erat ipsum sed metus.',
  'Mauris fermentum, libero ut tincidunt facilisis, lectus augue ultricies justo, non lacinia nisi mi sed orci. Suspendisse potenti. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
  'Praesent commodo, mi a luctus rhoncus, justo orci ornare massa, vitae viverra mi velit non est. Etiam dictum mauris ac hendrerit ullamcorper. Nullam fermentum velit sed leo dictum, in posuere odio congue.',
  'Final placeholder paragraph — replace this content with the production legal copy before launch. This screen is for layout review only.',
];

const SECTIONS: Record<
  LegalKind,
  { title: string; sub: string; sections: { h: string; body: string[] }[] }
> = {
  terms: {
    title: 'Terms of Service',
    sub: 'Last updated · Placeholder',
    sections: [
      { h: '1. Acceptance', body: PLACEHOLDER_PARAGRAPHS },
      { h: '2. Account & Conduct', body: PLACEHOLDER_PARAGRAPHS },
      { h: '3. Intellectual Property', body: PLACEHOLDER_PARAGRAPHS },
      { h: '4. Termination', body: PLACEHOLDER_PARAGRAPHS },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sub: 'Last updated · Placeholder',
    sections: [
      { h: '1. Data We Collect', body: PLACEHOLDER_PARAGRAPHS },
      { h: '2. How We Use It', body: PLACEHOLDER_PARAGRAPHS },
      { h: '3. Sharing & Third Parties', body: PLACEHOLDER_PARAGRAPHS },
      { h: '4. Your Rights', body: PLACEHOLDER_PARAGRAPHS },
    ],
  },
};

export function LegalModal({
  open,
  initialKind = 'terms',
  onClose,
  onAccept,
}: LegalModalProps): JSX.Element {
  const [kind, setKind] = useState<LegalKind>(initialKind);
  const cfg = SECTIONS[kind];

  return (
    <Modal
      open={open}
      title={cfg.title}
      onClose={onClose}
      size="lg"
      action={
        onAccept ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onAccept();
                onClose();
              }}
            >
              I Agree
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: 4,
          }}
        >
          {(['terms', 'privacy'] as LegalKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 14px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: kind === k ? 'var(--accent-yellow)' : 'var(--fg-tertiary)',
                cursor: 'pointer',
                borderBottom: `2px solid ${kind === k ? 'var(--accent-yellow)' : 'transparent'}`,
                marginBottom: -1,
                fontFamily: 'var(--font-ui)',
              }}
            >
              {k === 'terms' ? 'Terms' : 'Privacy'}
            </button>
          ))}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: 'var(--fg-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {cfg.sub}
        </p>

        <div
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            paddingRight: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            color: 'var(--fg-secondary)',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {cfg.sections.map((s) => (
            <section key={s.h}>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--fg-primary)',
                  fontFamily: 'var(--font-ui)',
                  letterSpacing: '0.04em',
                }}
              >
                {s.h}
              </h3>
              {s.body.map((p, i) => (
                <p key={i} style={{ margin: '0 0 8px' }}>
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
