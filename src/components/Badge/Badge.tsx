import styles from './Badge.module.css';

type BadgeProps = {
  label: string;
  variant?: 'cyan' | 'violet' | 'gold' | 'green';
  size?: 'sm' | 'md' | 'lg';
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ label, variant = 'cyan', size = 'md', ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]}`} {...props}>
      {label}
    </span>
  );
}