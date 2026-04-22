import { useState } from 'react';
import styles from './sections.module.css';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Field } from '../../components/ui/Field';
import { OtpField } from '../../components/ui/OtpField';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Slider } from '../../components/ui/Slider';
import { SegButton } from '../../components/ui/SegButton';
import { Chip } from '../../components/ui/Chip';
import { IconArrowRight, IconSearch } from '../../components/common/icons';

export function UISection(): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [seg, setSeg] = useState('red');
  const [range, setRange] = useState(40);

  return (
    <section className={styles.section} aria-labelledby="sec-ui">
      <h2 id="sec-ui" className={styles.sectionTitle}>
        UI primitives
      </h2>

      <h3 className={styles.subTitle}>Button — variants × sizes × states</h3>
      <div className={styles.row}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className={styles.row}>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary">Medium</Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button variant="primary" loading>
          Loading
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" trailingIcon={<IconArrowRight size={14} />}>
          With icon
        </Button>
      </div>

      <h3 className={styles.subTitle}>Input, Field, OtpField</h3>
      <div className={styles.row}>
        <Input placeholder="Plain input" />
        <Input placeholder="With error" error="Required" />
        <Input placeholder="With icon" icon={<IconSearch size={16} />} />
      </div>
      <div className={styles.row}>
        <Field label="Email" placeholder="you@zonite.dev" />
        <Field label="Password" type="password" placeholder="••••••••" required />
        <Field label="Broken" placeholder="required" error="Field is required" />
      </div>
      <div className={styles.row}>
        <OtpField length={6} value={otp} onChange={setOtp} label="OTP code" />
      </div>

      <h3 className={styles.subTitle}>Badge</h3>
      <div className={styles.row}>
        <Badge color="accent">Accent</Badge>
        <Badge color="success">Success</Badge>
        <Badge color="warning">Warning</Badge>
        <Badge color="error">Error</Badge>
        <Badge color="info">Info</Badge>
      </div>

      <h3 className={styles.subTitle}>Modal (opens in portal with focus trap + Esc)</h3>
      <div className={styles.row}>
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
      </div>
      <Modal
        open={modalOpen}
        title="Dialog title"
        onClose={() => setModalOpen(false)}
        action={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>
        }
      >
        Tab cycles between focusable elements, Shift+Tab reverses, Esc closes. Focus restores to the
        &ldquo;Open modal&rdquo; button on close.
      </Modal>

      <h3 className={styles.subTitle}>
        Alert — role=&quot;status&quot; (info/success) / role=&quot;alert&quot; (warn/danger)
      </h3>
      <div className={styles.stack}>
        <Alert type="info" title="Heads-up">
          This is informational.
        </Alert>
        <Alert type="success" title="Saved">
          Profile saved.
        </Alert>
        <Alert type="warn" title="Warning">
          Your connection is unstable.
        </Alert>
        <Alert type="danger" title="Error" dismissible>
          Something went wrong.
        </Alert>
      </div>

      <h3 className={styles.subTitle}>Avatar</h3>
      <div className={styles.row}>
        <Avatar initials="KX" size="sm" />
        <Avatar initials="KX" size="md" />
        <Avatar initials="KX" size="lg" />
      </div>

      <h3 className={styles.subTitle}>Slider</h3>
      <div className={styles.stack}>
        <Slider label="Volume" value={range} onChange={setRange} unit="%" />
      </div>

      <h3 className={styles.subTitle}>SegButton (radiogroup — arrow keys switch)</h3>
      <div className={styles.row}>
        <SegButton
          options={[
            { value: 'red', label: 'Red' },
            { value: 'blue', label: 'Blue' },
            { value: 'neutral', label: 'Neutral' },
          ]}
          value={seg}
          onChange={setSeg}
        />
      </div>

      <h3 className={styles.subTitle}>Chip</h3>
      <div className={styles.row}>
        <Chip label="Accent" variant="accent" onDismiss={() => undefined} />
        <Chip label="Success" variant="success" onDismiss={() => undefined} />
        <Chip label="Warning" variant="warning" onDismiss={() => undefined} />
        <Chip label="Error" variant="error" onDismiss={() => undefined} />
        <Chip label="Info" variant="info" onDismiss={() => undefined} />
      </div>
    </section>
  );
}
