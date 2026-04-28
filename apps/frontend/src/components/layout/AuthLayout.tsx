import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  step: string;
  title: string;
  subtitle?: string;
  hero: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({
  step,
  title,
  subtitle,
  hero,
  children,
}: AuthLayoutProps): JSX.Element {
  return (
    <div className={styles.root}>
      {/* Left: form */}
      <div className={styles.formCol}>
        <div className={styles.formInner}>
          <p className={`eyebrow ${styles.eyebrow}`}>{step}</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
        </div>
      </div>

      {/* Right: hero panel */}
      <div className={styles.heroCol}>
        <div className={styles.heroBg}>
          <div className={styles.heroGlow} />
          <div className={styles.heroGrid} />
        </div>
        <div className={styles.heroContent}>{hero}</div>
      </div>
    </div>
  );
}
