import styles from './Badge.module.css';

export type BadgeColor = 'accent' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  className?: string;
}

export const Badge = ({ children, color = 'accent', size = 'md', className = '' }: BadgeProps) => (
  <span className={`${styles.badge} ${styles[color]} ${styles[size]} ${className}`}>
    {children}
  </span>
);
