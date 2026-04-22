import styles from './Avatar.module.css';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Avatar = ({ src, alt, initials, size = 'md', onClick }: AvatarProps) => (
  <div
    className={`${styles.avatar} ${styles[size]}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {src ? (
      <img src={src} alt={alt} className={styles.image} />
    ) : (
      <span className={styles.initials}>{initials}</span>
    )}
  </div>
);
