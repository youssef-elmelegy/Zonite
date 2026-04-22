import { ReactNode } from 'react';
import { IconClose } from '../common/icons';
import styles from './Chip.module.css';

interface ChipProps {
  label: ReactNode;
  onDismiss?: () => void;
  variant?: 'accent' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  leadingIcon?: ReactNode;
  dismissible?: boolean;
}

/**
 * Chip (Dismissible Tag / Badge with Close)
 * Documented surface: --bg-card (with color variant border/text)
 * Consumed tokens: --accent-yellow, --lime-500, --orange-500, --fire-red, --sky-300, --radius-full, --sp-2, --sp-3
 * Keyboard: Tab reaches dismiss button; Enter/Space dismisses
 */
export const Chip = ({
  label,
  onDismiss,
  variant = 'accent',
  size = 'md',
  disabled = false,
  leadingIcon,
  dismissible = true,
}: ChipProps) => {
  return (
    <span
      className={`${styles.root} ${styles[`variant-${variant}`]} ${styles[`size-${size}`]} ${disabled ? styles.disabled : ''}`}
    >
      {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
      <span className={styles.label}>{label}</span>
      {dismissible && onDismiss && (
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          disabled={disabled}
          aria-label={`Remove ${label}`}
        >
          <IconClose size={16} />
        </button>
      )}
    </span>
  );
};
