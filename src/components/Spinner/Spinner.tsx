import styles from "./Spinner.module.css";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Spinner({ size = "md", label, ...props }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite" {...props}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
