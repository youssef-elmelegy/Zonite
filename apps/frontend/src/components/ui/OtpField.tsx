import { useRef } from 'react';
import styles from './OtpField.module.css';

export interface OtpFieldProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  /** Optional accessible label; rendered as the fieldset legend. */
  label?: string;
}

export const OtpField = ({
  length = 6,
  value = '',
  onChange,
  onComplete,
  label = 'Enter code',
}: OtpFieldProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, newDigit: string) => {
    // Allow only digits
    if (newDigit && !/^\d$/.test(newDigit)) return;

    const newValue = value.split('');
    newValue[index] = newDigit;
    const joined = newValue.join('');
    onChange?.(joined);

    // Auto-advance to next field if digit entered
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all fields filled
    if (joined.length === length) {
      onComplete?.(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');
      newValue[index] = '';
      const joined = newValue.join('');
      onChange?.(joined);

      // Auto-reverse to previous field on Backspace
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits) {
      onChange?.(digits.padEnd(length, ''));
      if (digits.length === length) {
        onComplete?.(digits);
      }
      inputRefs.current[Math.min(digits.length, length - 1)]?.focus();
    }
  };

  return (
    <fieldset className={styles.root}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.inputs}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            pattern="[0-9]"
            className={styles.input}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
    </fieldset>
  );
};
