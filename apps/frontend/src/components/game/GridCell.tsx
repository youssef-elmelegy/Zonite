import { MouseEvent } from 'react';
import styles from './GridCell.module.css';

export type CellState = 'empty' | 'own' | 'opponent' | 'disabled';

export interface GridCellProps {
  /** Unique cell identifier */
  id: string;
  /** Current state */
  state?: CellState;
  /** Whether the cell was just claimed (triggers animation) */
  justClaimed?: boolean;
  /** Position for grid layout */
  row: number;
  col: number;
  /** Click handler */
  onClick?: (id: string, row: number, col: number) => void;
  /** Hover handler */
  onHover?: (id: string) => void;
}

export const GridCell = ({
  id,
  state = 'empty',
  justClaimed = false,
  row,
  col,
  onClick,
  onHover,
}: GridCellProps) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onClick && state !== 'disabled') {
      onClick(id, row, col);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) onHover(id);
  };

  return (
    <button
      className={`${styles.cell} ${styles[state]} ${justClaimed ? styles.justClaimed : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      aria-label={`Cell ${row}-${col}: ${state}`}
      data-row={row}
      data-col={col}
      disabled={state === 'disabled'}
    />
  );
};
