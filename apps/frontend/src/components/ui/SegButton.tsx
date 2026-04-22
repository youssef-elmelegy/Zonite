import { ReactNode } from 'react';
import styles from './SegButton.module.css';

interface SegButtonOption {
  value: string;
  label: ReactNode;
}

interface SegButtonProps {
  options: SegButtonOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * Segmented Button (Pill Buttons)
 * Documented surface: --bg-card (outline), --accent-yellow (solid)
 * Consumed tokens: --accent-yellow, --bg-card, --fg-primary, --border-default, --radius-full, --sp-2, --sp-3
 * Keyboard: Arrow Left/Right to switch selected option, Tab reaches group
 */
export const SegButton = ({
  options,
  value,
  onChange,
  variant = 'outline',
  size = 'md',
  disabled = false,
}: SegButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, optionValue: string) => {
    if (disabled) return;

    const index = options.findIndex((opt) => opt.value === optionValue);
    if (index === -1) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = options[(index - 1 + options.length) % options.length];
      onChange(prev.value);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = options[(index + 1) % options.length];
      onChange(next.value);
    }
  };

  return (
    <div
      className={`${styles.root} ${styles[`variant-${variant}`]} ${styles[`size-${size}`]}`}
      role="radiogroup"
      aria-label="Toggle group"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className={`${styles.button} ${value === option.value ? styles.active : ''}`}
          aria-checked={value === option.value}
          onClick={() => !disabled && onChange(option.value)}
          onKeyDown={(e) => handleKeyDown(e, option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
