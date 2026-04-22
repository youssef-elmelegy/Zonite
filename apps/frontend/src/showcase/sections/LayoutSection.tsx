import styles from './sections.module.css';
import { CornerBlobs } from '../../components/layout/CornerBlobs';
import { GridBg } from '../../components/layout/GridBg';
import { TopBar } from '../../components/layout/TopBar';
import { PlayerChip } from '../../components/common/PlayerChip';

export function LayoutSection(): JSX.Element {
  return (
    <section className={styles.section} aria-labelledby="sec-layout">
      <h2 id="sec-layout" className={styles.sectionTitle}>
        Layout primitives
      </h2>

      <h3 className={styles.subTitle}>TopBar (with PlayerChip slot)</h3>
      <div className={styles.demoSurface}>
        <TopBar onHome={() => undefined} right={<PlayerChip playerName="Alice" team="blue" />} />
      </div>

      <h3 className={styles.subTitle}>CornerBlobs + GridBg (intensity 1)</h3>
      <div className={`${styles.demoSurface} ${styles.canvas}`}>
        <CornerBlobs intensity={1} />
        <GridBg visible={true} />
        <div className={styles.canvasContent}>Content layered above</div>
      </div>

      <h3 className={styles.subTitle}>CornerBlobs (intensity 0 — hidden)</h3>
      <div className={`${styles.demoSurface} ${styles.canvas}`}>
        <CornerBlobs intensity={0} />
        <GridBg visible={false} />
        <div className={styles.canvasContent}>Plain surface</div>
      </div>
    </section>
  );
}
