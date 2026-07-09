import { type ReactNode } from "react";
import styles from "./WorkoutSection.module.css";
import { GameCard } from "../Cards/Cards";

const GAMESCARDARR = [
  {
    id: "dino-hopper",
    title: "Dino Hopper",
    exercise: "Squats",
    description: "Help the dino hop through the obstacles!",
    ctaLabel: "Play",
    disabled: false,
  },
  {
    id: "lily-leaper",
    title: "Lily Leaper",
    exercise: "Push-Ups",
    description: "Guide the frog up through lily pads!",
    ctaLabel: "Coming Soon",
    disabled: true,
  },
];

const art: Record<string, ReactNode> = {
  "dino-hopper": (
    <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bhBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b3a86" />
          <stop offset="1" stopColor="#2a2150" />
        </linearGradient>
      </defs>
      <rect width="240" height="100" fill="url(#bhBg)" />
      <g stroke="#9b6dff" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M120 80 V44" />
        <path d="M120 70 H100" />
        <path d="M120 56 H140" />
      </g>
      <g transform="translate(120 44)">
        <ellipse cx="0" cy="-2" rx="11" ry="9" fill="#6ea8ff" />
        <circle cx="6" cy="-9" r="6" fill="#6ea8ff" />
        <circle cx="8" cy="-10" r="1.6" fill="#0a0e2a" />
        <path d="M12 -9 l7 2 -7 2 z" fill="#f0913c" />
        <path d="M-3 -2 q-8 -1 -11 4 q7 2 11 -1 z" fill="#4d8df6" />
      </g>
    </svg>
  ),
  "lily-leaper": (
    <svg viewBox="0 0 240 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="llBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f6b63" />
          <stop offset="1" stopColor="#123c3a" />
        </linearGradient>
      </defs>
      <rect width="240" height="100" fill="url(#llBg)" />
      <ellipse cx="120" cy="76" rx="36" ry="11" fill="#2f8f55" />
      <path d="M120 76 V64" stroke="#123c3a" strokeWidth="3" />
      <g transform="translate(120 60)">
        <ellipse cx="0" cy="4" rx="16" ry="11" fill="#4fae5a" />
        <circle cx="-7" cy="-7" r="6" fill="#4fae5a" />
        <circle cx="7" cy="-7" r="6" fill="#4fae5a" />
        <circle cx="-7" cy="-8" r="2.4" fill="#0a0e2a" />
        <circle cx="7" cy="-8" r="2.4" fill="#0a0e2a" />
        <path d="M-6 6 q6 5 12 0" stroke="#1f5b33" strokeWidth="2" fill="none" />
      </g>
    </svg>
  ),
};

function WorkoutSection() {
  return (
    <section id="games" className={styles.games}>
      <div className={styles.gamesInner}>
        <span className={styles.gamesPill}>Choose your game</span>
        <h3 className={styles.gamesHeading}>Select a workout</h3>

        <div className={styles.gamesGrid}>
          {GAMESCARDARR.map((game) => (
            <GameCard
              key={game.id}
              gameId={game.id}
              media={art[game.id]}
              title={game.title}
              exercise={game.exercise}
              description={game.description}
              ctaLabel={game.ctaLabel}
              disabled={game.disabled}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorkoutSection;
