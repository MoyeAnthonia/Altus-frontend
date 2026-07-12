import { Link, useLocation } from "react-router";
import styles from "./NotFound.module.css";

export function NotFound() {
  const location = useLocation();

  return (
    <main className={styles.wrapper}>
      <div className={styles.panel}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Level Not Found</h1>

        <p className={styles.message}>
          The route <code className={styles.path}>{location.pathname}</code> doesn&apos;t exist.
          Maybe it never did.
        </p>

        <div className={styles.actions}>
          <Link to="/" className={styles.primary}>
            Return to Base
          </Link>
          <Link to="/level" className={styles.secondary}>
            Pick a Game
          </Link>
        </div>
      </div>
    </main>
  );
}
