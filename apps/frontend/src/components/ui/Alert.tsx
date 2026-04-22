import { ReactNode } from 'react';
import styles from './Alert.module.css';
import { IconClose } from '../common/icons';

export type AlertType = 'info' | 'success' | 'warn' | 'danger';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export const Alert = ({
  type = 'info',
  title,
  children,
  onDismiss,
  dismissible = false,
}: AlertProps) => {
  const role = type === 'info' || type === 'success' ? 'status' : 'alert';

  return (
    <div className={`${styles.alert} ${styles[type]}`} role={role}>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {dismissible && (
        <button
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss alert"
          type="button"
        >
          <IconClose size={18} />
        </button>
      )}
    </div>
  );
};
