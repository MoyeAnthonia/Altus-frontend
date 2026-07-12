import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
}

function Spinner({ label }: SpinnerProps) {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
      {label && <span className={styles.spinnerLabel}>{label}</span>}
    </div>
  );
}

export default Spinner;
