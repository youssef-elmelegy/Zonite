import { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, className, ...props }: InputProps) => {
  return (
    <div className={styles.root}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.wrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
          {...props}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
