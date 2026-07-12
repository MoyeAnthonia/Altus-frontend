import { useEffect } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router";
import { useProfile } from "../../context/useProfile";

/* ── Types ── */
interface DayData {
  day: string;
  reps: number;
}

interface Badge {
  id: string;
  icon: string;
  name: string;
}

const BAR_MAX_HEIGHT = 100; // px
const BADGE_ICONS: Record<string, string> = {
  "First Workout": "🐣",
  "Getting Started": "🌱",
  "On a Roll": "🎯",
  Dedicated: "🏋️",
  Unstoppable: "🚀",
  "First Steps": "👣",
  Century: "💯",
  "Rep Machine": "⚙️",
  "Beast Mode": "🦍",
  "Warm Up": "🌡️",
  "Calorie Burner": "🔥",
  Inferno: "🌋",
};

function getBadgeIcon(name: string): string {
  return BADGE_ICONS[name] ?? "🏅";
}

// No GET /achievements catalog endpoint exists yet — only unlocked
// achievements come back from the API, so there's no real data to
// render a "locked" state from. Hardcoded for MVP until that lands.
const lockedBadges: Badge[] = [
  { id: "legend", icon: "👑", name: "Legend" },
  { id: "master", icon: "🎖️", name: "Master" },
  { id: "month-champion", icon: "📅", name: "Month Champion" },
];

/* ── Component ── */
function Dashboard() {
  const nav = useNavigate();
  const { sessions, stats, achievements, isLoading, error, refreshProfile } = useProfile();

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const navGames = () => {
    nav("/workout");
  };

  // Last 7 days, today included, oldest first — reps summed per day from real sessions.
  const today = new Date();
  const weeklyData: DayData[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateKey = date.toDateString();

    const reps = sessions
      .filter((s) => new Date(s.completed_at).toDateString() === dateKey)
      .reduce((sum, s) => sum + s.reps_completed, 0);

    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), reps };
  });

  const maxReps = Math.max(...weeklyData.map((d) => d.reps), 1);

  return (
    <div className={styles.dbPage}>
      {/* NAV */}
      <nav className={styles.dbNav}>
        <button className={styles.dbNavBtn} onClick={() => nav(-1)}>
          ← Back
        </button>
        <span className={styles.dbPageTitle}>Dashboard</span>
        <button className={`${styles.dbNavBtn} ${styles.dbNavBtnAmber}`} onClick={navGames}>
          Play →
        </button>
      </nav>

      {isLoading ? (
        <p style={{ padding: "24px", textAlign: "center" }}>Loading your stats…</p>
      ) : error ? (
        <p style={{ padding: "24px", textAlign: "center" }}>{error}</p>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className={styles.dbStatsRow}>
            <div className={styles.dbStatCard}>
              <span className={styles.dbStatIcon}>💪</span>
              <div className={styles.dbStatBody}>
                <span className={styles.dbStatValue}>{stats.total_reps}</span>
                <span className={styles.dbStatLabel}>Total Reps</span>
              </div>
            </div>

            <div className={`${styles.dbStatCard} ${styles.dbStatCardBlue}`}>
              <span className={styles.dbStatIcon}>🔥</span>
              <div className={styles.dbStatBody}>
                <span className={`${styles.dbStatValue} ${styles.dbStatValueBlue}`}>
                  {stats.total_calories.toFixed(1)}
                </span>
                <span className={styles.dbStatLabel}>Calories Burned</span>
              </div>
            </div>

            <div className={styles.dbStatCard}>
              <span className={styles.dbStatIcon}>🏅</span>
              <div className={styles.dbStatBody}>
                <span className={styles.dbStatValue}>{achievements.length}</span>
                <span className={styles.dbStatLabel}>Badges Earned</span>
              </div>
            </div>
          </div>

          {/* WEEKLY REPS CHART */}
          <section className={styles.dbWeeklySection}>
            <h2 className={styles.dbSectionTitle}>Weekly Reps</h2>

            <div className={styles.dbBarChart}>
              {weeklyData.map((d, i) => {
                const barH = d.reps > 0 ? Math.round((d.reps / maxReps) * BAR_MAX_HEIGHT) : 0;
                return (
                  <div key={`${d.day}-${i}`} className={styles.dbBarCol}>
                    <span className={styles.dbBarCount}>{d.reps}</span>
                    <div className={styles.dbBarWrap}>
                      {d.reps > 0 ? (
                        <div
                          className={`${styles.dbBar} ${styles.dbBarSquat}`}
                          style={{ height: `${barH}px` }}
                        ></div>
                      ) : (
                        <div style={{ height: `${BAR_MAX_HEIGHT}px` }}></div>
                      )}
                    </div>
                    <span className={styles.dbBarDay}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* EARNED BADGES */}
          <section className={styles.dbBadgesSection}>
            <h2 className={`${styles.dbSectionTitle} ${styles.dbSectionTitleAmber}`}>
              Earned Badges
            </h2>
            {achievements.length === 0 ? (
              <p>No badges earned yet — play a workout to unlock your first one!</p>
            ) : (
              <div className={styles.dbBadgesGrid}>
                {achievements.map((a) => (
                  <div key={a.id} className={styles.dbBadgeCard} title={a.description}>
                    <span className={styles.dbBadgeIcon}>
                      {a.badge_image ? (
                        <img src={a.badge_image} alt={a.name} />
                      ) : (
                        getBadgeIcon(a.name)
                      )}
                    </span>
                    <span className={styles.dbBadgeName}>{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* LOCKED BADGES */}
          <section className={`${styles.dbBadgesSection} ${styles.dbBadgesSectionLocked}`}>
            <h2 className={`${styles.dbSectionTitle} ${styles.dbSectionTitleViolet}`}>
              Locked Badges
            </h2>
            <div className={`${styles.dbBadgesGrid} ${styles.dbBadgesGridLocked}`}>
              {lockedBadges.map((b) => (
                <div key={b.id} className={`${styles.dbBadgeCard} ${styles.dbBadgeCardLocked}`}>
                  <span className={styles.dbBadgeIcon}>{b.icon}</span>
                  <span className={`${styles.dbBadgeName} ${styles.dbBadgeNameLocked}`}>
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
