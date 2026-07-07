import styles from "./home.module.css";
import heroImage from "../assets/hero-skyhop-gameplay.jpg";
import iconCamera from "../assets/icon-camera.jpg";
import iconMotion from "../assets/icon-motion.jpg";
import iconPlay from "../assets/icon-play.jpg";
import { useNavigate } from "react-router";
import Button from "../components/Button/Button";
import { Badge } from "../components/Badge/Badge";
import { useAuth } from "../context/useAuth";
import WorkoutSection from "../components/WorkoutSection/WorkoutSection";
import { FeatureCard, AudienceCard } from "../components/Cards/Cards";

type Stat = { value: string; label: string };

type HeroProps = {
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  stats?: Stat[];
};

const defaultStats: Stat[] = [
  { value: "2", label: "Games" },
  { value: "5", label: "Players" },
  { value: "★ 4.9", label: "Rating" },
];

const FEATURECARDSARR = [
  {
    title: "Webcam Tracking",
    description:
      "Our AI-powered pose detection tracks your movements in real-time using just your webcam.",
    icon: <img src={iconCamera} alt="camera icon" />,
  },
  {
    title: "Real Exercises",
    description:
      "Do actual push-ups and squats to control your character. Every rep counts toward your progress.",
    icon: <img src={iconMotion} alt="Motion icon" />,
  },
  {
    title: "Track Progress",
    description:
      "Earn XP, unlock badges, and maintain daily streaks. Watch your fitness level up over time.",
    icon: <img src={iconPlay} alt="play icon" />,
  },
];
// const icons: Record<string, ReactNode> = {
//   chair: <img src={iconCamera} alt="chair icon" />,
//   recovery: <img src={iconMotion} alt="recovery icon" />,
//   nogym: <img src={iconPlay} alt="no-gym icon" />,
// };

const USERSTYPECARDSARR = [
  {
    id: "chair",
    accent: "orange",
    title: "Your chair is killing you",
    description:
      "Sciatica, piriformis syndrome, lower back pain, and tech neck — sitting disease is real. Eight hours at a desk compresses your spine and pinches your sciatic nerve, causing that electric shooting pain down your leg. Altus reminds you to move your body every 60 minutes (or more, or less).",
    ctaLabel: "Add movement before the damage sets in",
  },
  {
    id: "recovery",
    accent: "cyan",
    title: "Where recovery meets play",
    description:
      "Foam rolling and stretching feel like chores. Altus turns mobility work into motion-controlled mini-games, so active recovery becomes something you actually look forward to between training days.",
    ctaLabel: "Turn rest days into play days",
  },
  {
    id: "nogym",
    accent: "blue",
    title: "No gym, no equipment, no excuses",
    description:
      "No membership, no dumbbells, no problem. Every Altus session uses just your bodyweight and your webcam, so you can get moving in your living room with zero setup.",
    ctaLabel: "Start with just your body",
  },
];

function Home({
  badge = "Webcam Powered Fitness",
  title = "Get Moving",
  subtitle = "Turn Your Workouts Into Games",
  description = "Use pose detection technology to play arcade-style games while doing real exercises. Each push-up and squat controls your character in real-time.",
  stats = defaultStats,
}: HeroProps) {
  const nav = useNavigate();
  const navGames = () => {
    nav("/workout");
  };
  const navLogin = () => {
    nav("/login");
  };
  const { isAuthenticated } = useAuth();
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <Badge label={badge} variant="cyan" />
        <h1 className={styles.heroTitle}>{title}</h1>
        <h2 className={styles.subtitle}>{subtitle}</h2>
        <p className={styles.description}>{description}</p>

        <div className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          {" "}
          {isAuthenticated ? (
            <>
              <Button
                onClick={navGames}
                label="Start Playing"
                variant="primary"
                aria-label="Start Game"
              />
            </>
          ) : (
            <Button
              onClick={navLogin}
              label="Start Playing"
              variant="primary"
              aria-label="Start Game"
            />
          )}
          <Button label="Watch Demo" variant="secondary" aria-label="Watch App Demo" />
        </div>
      </div>

      <div className={styles.media}>
        <div className={styles.imageFrame}>
          <img
            className={styles.image}
            src={heroImage}
            alt="Player doing a squat to control an arcade game character"
          />
        </div>
      </div>
    </section>
  );
}

function Features({ badge = "Features" }: { badge?: string }) {
  return (
    <section id="features" className={styles.how}>
      <div className="wrap">
        <div className={styles.how__head}>
          <Badge label={badge} variant="cyan" />
          <h2 className={styles.heading}>How It Works</h2>
        </div>

        <div className={styles.how__grid}>
          {FEATURECARDSARR.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection({ badge = "Users" }: { badge?: string }) {
  type Accent = "orange" | "cyan" | "blue";
  return (
    <section id="audience" className={styles.section}>
      <div className={styles.inner}>
        <Badge label={badge} variant="cyan" />
        <h2 className={styles.heading}>Who is this for?</h2>
        <p className={styles.subtitle}>
          Altus is built for anyone who wants to move more and sit less
        </p>

        <div className={styles.grid}>
          {USERSTYPECARDSARR.map((item) => (
            <AudienceCard
              key={item.id ?? item.title}
              accent={item.accent as Accent}
              // icon={item.icon ?? icons[item.id ?? ""] ?? null}
              title={item.title}
              description={item.description}
              ctaLabel={item.ctaLabel}
            />
          ))}
        </div>

        <p className={styles.footnote}>Click a card to learn more</p>
      </div>
    </section>
  );
}

function SelectWorkoutSection() {
  return <WorkoutSection></WorkoutSection>;
}
export { Home, Features, AudienceSection, SelectWorkoutSection };
