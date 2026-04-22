import { InputHTMLAttributes, useId } from 'react';
import styles from './Field.module.css';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export const Field = ({ label, error, hint, icon, required, className, ...props }: FieldProps) => {
  const id = useId();

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.wrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
          {...props}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
