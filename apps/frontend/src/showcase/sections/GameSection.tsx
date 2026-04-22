import { useEffect, useState } from 'react';
import styles from './sections.module.css';
import { GridCell, type CellState } from '../../components/game/GridCell';
import { Button } from '../../components/ui/Button';

const STATES: CellState[] = ['empty', 'own', 'opponent', 'disabled'];

export function GameSection(): JSX.Element {
  const [pulseKey, setPulseKey] = useState(0);
  const [pulseTarget, setPulseTarget] = useState<null | 'own' | 'opponent'>(null);

  useEffect(() => {
    if (!pulseTarget) return;
    const t = window.setTimeout(() => setPulseTarget(null), 450);
    return () => window.clearTimeout(t);
  }, [pulseKey, pulseTarget]);

  return (
    <section className={styles.section} aria-labelledby="sec-game">
      <h2 id="sec-game" className={styles.sectionTitle}>
        Game primitive
      </h2>

      <h3 className={styles.subTitle}>GridCell — every state</h3>
      <div className={styles.gridGame}>
        {STATES.map((state) => (
          <div key={state} className={styles.gameTile}>
            <GridCell id={`demo-${state}`} state={state} row={0} col={0} />
            <code>{state}</code>
          </div>
        ))}
      </div>

      <h3 className={styles.subTitle}>Claim animation (claimPulse)</h3>
      <div className={styles.row}>
        <Button
          onClick={() => {
            setPulseTarget('own');
            setPulseKey((k) => k + 1);
          }}
        >
          Trigger claim (own)
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setPulseTarget('opponent');
            setPulseKey((k) => k + 1);
          }}
        >
          Trigger claim (opponent)
        </Button>
      </div>
      <div className={styles.gridGame}>
        <div className={styles.gameTile}>
          <GridCell
            key={`claim-own-${pulseKey}`}
            id="claim-own"
            state="own"
            row={0}
            col={0}
            justClaimed={pulseTarget === 'own'}
          />
          <code>own + justClaimed</code>
        </div>
        <div className={styles.gameTile}>
          <GridCell
            key={`claim-opp-${pulseKey}`}
            id="claim-opp"
            state="opponent"
            row={0}
            col={0}
            justClaimed={pulseTarget === 'opponent'}
          />
          <code>opponent + justClaimed</code>
        </div>
      </div>
    </section>
  );
}
