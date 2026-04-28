import { InputHTMLAttributes, useId } from 'react';
import styles from './Field.module.css';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  required?: boolean;
}

export const Field = ({
  label,
  error,
  hint,
  icon,
  right,
  required,
  className,
  ...props
}: FieldProps) => {
  const id = useId();

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
          {...props}
        />
        {right && <span className={styles.right}>{right}</span>}
      </div>
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
