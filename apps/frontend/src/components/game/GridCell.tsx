import { KeyboardEvent, MouseEvent } from 'react';
import styles from './GridCell.module.css';

export type CellState = 'empty' | 'own' | 'opponent' | 'disabled';

export interface GridCellProps {
  id: string;
  state?: CellState;
  justClaimed?: boolean;
  isOwnBlock?: boolean;
  row: number;
  col: number;
  onClick?: (id: string, row: number, col: number) => void;
  onHover?: (id: string) => void;
  /** Custom fill color — overrides team CSS vars (used in solo mode for per-player colors) */
  color?: string;
  /** 0..1 progress through cooldown (0 = just locked, 1 = unlocked). 0 means no active cooldown. */
  cooldownProgress?: number;
}

export const GridCell = ({
  id,
  state = 'empty',
  justClaimed = false,
  isOwnBlock = false,
  row,
  col,
  onClick,
  onHover,
  color,
  cooldownProgress = 0,
}: GridCellProps) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onClick && state !== 'disabled') {
      onClick(id, row, col);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Block Enter/Space from triggering claims — keyboard navigation is a cheat vector
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleMouseEnter = () => {
    if (onHover) onHover(id);
  };

  let inlineStyle: React.CSSProperties | undefined;
  if (color && state !== 'empty' && state !== 'disabled') {
    inlineStyle = {
      background: color,
      borderColor: color,
      boxShadow: `0 0 10px ${color}55, inset 0 0 0 1px rgba(255,255,255,0.15)`,
      ...(isOwnBlock ? { filter: 'brightness(1.3)' } : {}),
    };
  } else if (isOwnBlock) {
    inlineStyle = { filter: 'brightness(1.3)' };
  }

  const showCooldown = cooldownProgress > 0 && cooldownProgress < 1;

  return (
    <button
      className={`${styles.cell} ${styles[state]} ${justClaimed ? styles.justClaimed : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onKeyDown={handleKeyDown}
      aria-label={`Cell ${row}-${col}: ${state}`}
      data-row={row}
      data-col={col}
      tabIndex={-1}
      disabled={state === 'disabled'}
      style={inlineStyle}
    >
      {showCooldown && (
        <span
          className={styles.cooldownStripe}
          style={{ transform: `scaleX(${cooldownProgress})` }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
