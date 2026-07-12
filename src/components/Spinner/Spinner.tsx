import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
  size?: "sm" | "md";
}

function Spinner({ label, size = "md" }: SpinnerProps) {
  const wrapClass =
    size === "sm" ? `${styles.spinnerWrap} ${styles.spinnerWrapSm}` : styles.spinnerWrap;
  const ringClass = size === "sm" ? `${styles.spinner} ${styles.spinnerSm}` : styles.spinner;

  return (
    <div className={wrapClass}>
      <div className={ringClass} />
      {label && <span className={styles.spinnerLabel}>{label}</span>}
    </div>
  );
}

export { Spinner };
export default Spinner;
