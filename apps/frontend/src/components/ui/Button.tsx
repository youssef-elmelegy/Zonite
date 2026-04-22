import { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon on the left */
  leadingIcon?: React.ReactNode;
  /** Icon on the right */
  trailingIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
    </button>
  );
};
