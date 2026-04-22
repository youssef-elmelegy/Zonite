import { useState } from 'react';
import styles from './sections.module.css';
import { PlayerChip } from '../../components/common/PlayerChip';
import { Countdown } from '../../components/common/Countdown';
import { Button } from '../../components/ui/Button';
import {
  IconCopy,
  IconClose,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconCheckCircle,
  IconXCircle,
  IconSearch,
  IconInfo,
  IconWarn,
  IconEye,
  IconEyeOff,
  IconSettings,
  IconMenu,
  IconArrowLeft,
  IconArrowRight,
  IconLoader,
  IconUser,
  IconCrownHost,
  ZoniteLogo,
  YalgamersLogo,
} from '../../components/common/icons';

const LUCIDE_ICONS = [
  { name: 'IconCopy', Icon: IconCopy },
  { name: 'IconClose', Icon: IconClose },
  { name: 'IconChevronDown', Icon: IconChevronDown },
  { name: 'IconChevronUp', Icon: IconChevronUp },
  { name: 'IconCheck', Icon: IconCheck },
  { name: 'IconCheckCircle', Icon: IconCheckCircle },
  { name: 'IconXCircle', Icon: IconXCircle },
  { name: 'IconSearch', Icon: IconSearch },
  { name: 'IconInfo', Icon: IconInfo },
  { name: 'IconWarn', Icon: IconWarn },
  { name: 'IconEye', Icon: IconEye },
  { name: 'IconEyeOff', Icon: IconEyeOff },
  { name: 'IconSettings', Icon: IconSettings },
  { name: 'IconMenu', Icon: IconMenu },
  { name: 'IconArrowLeft', Icon: IconArrowLeft },
  { name: 'IconArrowRight', Icon: IconArrowRight },
  { name: 'IconLoader', Icon: IconLoader },
  { name: 'IconUser', Icon: IconUser },
];

export function CommonSection(): JSX.Element {
  const [countdownSeconds, setCountdownSeconds] = useState(30);

  return (
    <section className={styles.section} aria-labelledby="sec-common">
      <h2 id="sec-common" className={styles.sectionTitle}>
        Common primitives
      </h2>

      <h3 className={styles.subTitle}>PlayerChip</h3>
      <div className={styles.row}>
        <PlayerChip playerName="Alice" team="red" />
        <PlayerChip playerName="Bob" team="blue" />
        <PlayerChip playerName="Sam" team="neutral" />
        <PlayerChip playerName="Idle" team="blue" status="idle" />
        <PlayerChip playerName="Gone" team="red" status="disconnected" />
      </div>

      <h3 className={styles.subTitle}>Countdown — normal / warning / critical</h3>
      <div className={styles.row}>
        <Countdown seconds={countdownSeconds} warning={20} critical={10} />
        <Countdown seconds={countdownSeconds} warning={20} critical={10} compact />
      </div>
      <div className={styles.row}>
        <Button size="sm" variant="ghost" onClick={() => setCountdownSeconds(30)}>
          Reset → 30s (normal)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCountdownSeconds(18)}>
          Set 18s (warning)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCountdownSeconds(8)}>
          Set 8s (critical, pulsing)
        </Button>
      </div>

      <h3 className={styles.subTitle}>Brand icons</h3>
      <div className={styles.row}>
        <div className={styles.iconTile}>
          <IconCrownHost size={32} />
          <code>IconCrownHost</code>
        </div>
        <div className={styles.iconTile}>
          <ZoniteLogo size={48} />
          <code>ZoniteLogo</code>
        </div>
        <div className={styles.iconTile}>
          <YalgamersLogo size={48} />
          <code>YalgamersLogo</code>
        </div>
      </div>

      <h3 className={styles.subTitle}>Lucide icons (uniformly Icon*-prefixed)</h3>
      <div className={styles.iconGrid}>
        {LUCIDE_ICONS.map(({ name, Icon }) => (
          <div key={name} className={styles.iconTile}>
            <Icon size={20} />
            <code>{name}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
