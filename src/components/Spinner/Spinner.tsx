import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
  size?: "sm" | "md";
  labelClassName?: string;
}

function Spinner({ label, size = "md", labelClassName }: SpinnerProps) {
  const wrapClass =
    size === "sm" ? `${styles.spinnerWrap} ${styles.spinnerWrapSm}` : styles.spinnerWrap;
  const ringClass = size === "sm" ? `${styles.spinner} ${styles.spinnerSm}` : styles.spinner;
  const labelClass = labelClassName
    ? `${styles.spinnerLabel} ${labelClassName}`
    : styles.spinnerLabel;

  return (
    <div className={wrapClass}>
      <div className={ringClass} />
      {label && <span className={labelClass}>{label}</span>}
    </div>
  );
}

export { Spinner };
export default Spinner;
