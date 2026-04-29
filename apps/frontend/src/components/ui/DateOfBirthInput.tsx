import { useRef } from 'react';
import { IconCalendar } from '../common/icons';

interface DateOfBirthInputProps {
  value: string;
  onChange: (v: string) => void;
  max?: string;
  min?: string;
  placeholder?: string;
}

const todayISO = new Date().toISOString().slice(0, 10);

export function DateOfBirthInput({
  value,
  onChange,
  max = todayISO,
  min = '1900-01-01',
  placeholder = 'Select your date of birth',
}: DateOfBirthInputProps): JSX.Element {
  const ref = useRef<HTMLInputElement>(null);

  function open() {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  }

  const display = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      onClick={open}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(23,14,27,0.8)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 140ms var(--ease-out)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-yellow)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
    >
      <IconCalendar size={16} color="var(--accent-yellow)" />
      <span
        style={{
          flex: 1,
          fontSize: 14,
          color: value ? 'var(--fg-primary)' : 'var(--fg-muted)',
          fontFamily: 'var(--font-ui)',
          userSelect: 'none',
        }}
      >
        {display || placeholder}
      </span>
      <input
        ref={ref}
        type="date"
        value={value}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          colorScheme: 'dark',
          border: 'none',
          padding: 0,
        }}
      />
    </div>
  );
}
