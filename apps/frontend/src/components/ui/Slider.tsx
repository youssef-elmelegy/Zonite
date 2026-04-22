import styles from './Slider.module.css';

export interface SliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  /** Unit suffix for the displayed value (e.g. `%`, `px`). */
  unit?: string;
  /** Accessible label, defaults to `label` if provided. */
  'aria-label'?: string;
}

export const Slider = ({
  label,
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  onChange,
  disabled,
  unit = '',
  'aria-label': ariaLabel,
}: SliderProps) => (
  <div className={styles.root}>
    {label && <label className={styles.label}>{label}</label>}
    <div className={styles.container}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className={styles.slider}
      />
      <span className={styles.value}>
        {value}
        {unit}
      </span>
    </div>
  </div>
);
