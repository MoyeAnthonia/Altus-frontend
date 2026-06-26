import type { ReactNode, RefObject, HTMLAttributes } from "react";
import { useNavigate } from "react-router";
import styles from "./Cards.module.css";

export interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  title: string;
  description: string;
}

type AudienceCardProps = HTMLAttributes<HTMLDivElement> & {
  // icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  accent?: "orange" | "cyan" | "blue";
};

type GameCardProps = HTMLAttributes<HTMLDivElement> & {
  media: ReactNode;
  title: string;
  exercise: string;
  description: string;
  ctaLabel?: string;
};

function FeatureCard({ icon, title, description, className, ...rest }: FeatureCardProps) {
  return (
    <article className={[styles.step, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.stepIcon} aria-hidden="true">
        {icon}
      </div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </article>
  );
}

function AudienceCard({
  // icon,
  title,
  description,
  ctaLabel,
  accent = "orange",
  className,
  ...props
}: AudienceCardProps) {
  return (
    <article className={`${styles.card} ${styles[accent]} ${className ?? ""}`} {...props}>
      <header className={styles.header}>
        <span className={styles.iconTile} aria-hidden="true">
          {/* {icon}  */}X
        </span>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.chevron} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </header>

      <div className={styles.bodyWrap}>
        <div className={styles.bodyInner}>
          <p className={styles.description}>{description}</p>
          {ctaLabel ? (
            <button type="button" className={styles.cta}>
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function GameCard({
  media,
  title,
  exercise,
  description,
  ctaLabel = "Play",
  className,
  ...props
}: GameCardProps) {
  const nav = useNavigate();
  const gameNavigate = () => {
    nav("/level");
  };

  return (
    <article className={`${styles.gameCard} ${className ?? ""}`} {...props}>
      <div className={styles.gameMedia}>{media}</div>

      <h3 className={styles.gameTitle}>{title}</h3>
      <p className={styles.gameExercise}>{exercise}</p>
      <p className={styles.gameDesc}>{description}</p>
      <button type="button" className={styles.playBtn} onClick={gameNavigate}>
        {ctaLabel}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </article>
  );
}

export type MotionCardSize = "default" | "compact";

interface MotionCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Ref to the underlying <video> element so a MediaStream can be attached from the parent. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Caption shown in the bottom strip, e.g. "Squat Detection". */
  label: string;
  /** "compact" shrinks the aspect ratio for tighter layouts, like an in-game split screen. */
  size?: MotionCardSize;
  /** Shows the dashed alignment guide — useful during calibration, not during live gameplay. */
  showGuide?: boolean;
  /** Anything rendered on top of the feed: a CTA button, a status badge, a pose overlay canvas. */
  children?: ReactNode;
}

function MotionCard({
  videoRef,
  label,
  size = "default",
  showGuide = false,
  children,
  className,
  ...rest
}: MotionCardProps) {
  const cardClass = [styles.mcCard, size === "compact" && styles.mcCompact, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass} {...rest}>
      <video ref={videoRef} className={styles.mcVideo} autoPlay playsInline muted />

      <div className={styles.mcGlow}></div>

      {showGuide && <div className={styles.mcDashedGuide}></div>}

      {children && <div className={styles.mcOverlay}>{children}</div>}

      <div className={styles.mcLabel}>{label}</div>
    </div>
  );
}

export { FeatureCard, AudienceCard, GameCard, MotionCard };
