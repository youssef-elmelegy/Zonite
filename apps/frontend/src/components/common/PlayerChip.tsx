import styles from './PlayerChip.module.css';

export interface PlayerChipProps {
  playerName: string;
  /** Team color: 'red' | 'blue' | 'neutral' */
  team?: 'red' | 'blue' | 'neutral';
  /** Player status indicator */
  status?: 'active' | 'idle' | 'disconnected';
  /** Optional click handler */
  onClick?: () => void;
}

export function PlayerChip({
  playerName,
  team = 'neutral',
  status = 'active',
  onClick,
}: PlayerChipProps): JSX.Element {
  const teamColorVar =
    team === 'red' ? '--team-red' : team === 'blue' ? '--team-blue' : '--team-neutral';
  const statusIndicator = status === 'disconnected' ? '⊘' : '●';

  return (
    <div
      className={styles.root}
      data-team={team}
      data-status={status}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ borderColor: `var(${teamColorVar})` }}
    >
      <span className={styles.indicator} aria-label={status}>
        {statusIndicator}
      </span>
      <span className={styles.name}>{playerName}</span>
    </div>
  );
}
