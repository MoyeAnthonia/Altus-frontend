import React from "react";
import styles from "./Button.module.css";

// declare the props Data type
type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>; // Data types for other button attributes.

function Button({ label, variant = "primary", disabled = false, ...props }: ButtonProps) {
  return (
    // html and styles for the button
    <button className={`${styles.button} ${styles[variant]}`} disabled={disabled} {...props}>
      {label}
    </button>
  );
}

export default Button;
