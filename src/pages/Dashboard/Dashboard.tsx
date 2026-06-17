import styles from "./Dashboard.module.css";

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

/* ── Static data (wire to Supabase in Week 5) ── */
const weeklyData: DayData[] = [
  { day: "Mon", reps: 55 },
  { day: "Tue", reps: 60 },
  { day: "Wed", reps: 0 },
  { day: "Thu", reps: 80 },
  { day: "Fri", reps: 85 },
  { day: "Sat", reps: 60 },
  { day: "Sun", reps: 95 },
];

const maxReps = Math.max(...weeklyData.map((d) => d.reps), 1);
const BAR_MAX_HEIGHT = 100; // px

const earnedBadges: Badge[] = [
  { id: "first-flight", icon: "🐣", name: "First Flight" },
  { id: "rising-star", icon: "⭐", name: "Rising Star" },
  { id: "trailblazer", icon: "💥", name: "Trailblazer" },
  { id: "champion", icon: "🏆", name: "Champion" },
  { id: "week-warrior", icon: "🔥", name: "Week Warrior" },
];

const lockedBadges: Badge[] = [
  { id: "legend", icon: "👑", name: "Legend" },
  { id: "master", icon: "🎖️", name: "Master" },
  { id: "month-champion", icon: "📅", name: "Month Champion" },
];

/* ── Component ── */
function Dashboard() {
  return (
    <div className={styles.dbPage}>
      {/* NAV */}
      <nav className={styles.dbNav}>
        <button className={styles.dbNavBtn}>← Back</button>
        <span className={styles.dbPageTitle}>Dashboard</span>
        <button className={`${styles.dbNavBtn} ${styles.dbNavBtnAmber}`}>Play →</button>
      </nav>

      {/* STAT CARDS */}
      <div className={styles.dbStatsRow}>
        <div className={styles.dbStatCard}>
          <span className={styles.dbStatIcon}>🔥</span>
          <div className={styles.dbStatBody}>
            <span className={styles.dbStatValue}>7</span>
            <span className={styles.dbStatLabel}>Day Streak</span>
          </div>
        </div>

        <div className={`${styles.dbStatCard} ${styles.dbStatCardBlue}`}>
          <span className={styles.dbStatIcon}>⚡</span>
          <div className={styles.dbStatBody}>
            <span className={`${styles.dbStatValue} ${styles.dbStatValueBlue}`}>12,450</span>
            <span className={styles.dbStatLabel}>Total XP</span>
          </div>
        </div>

        <div className={styles.dbStatCard}>
          <span className={styles.dbStatIcon}>🏅</span>
          <div className={styles.dbStatBody}>
            <span className={styles.dbStatValue}>5</span>
            <span className={styles.dbStatLabel}>Badges</span>
          </div>
        </div>
      </div>

      {/* WEEKLY REPS CHART */}
      <section className={styles.dbWeeklySection}>
        <h2 className={styles.dbSectionTitle}>Weekly Reps</h2>

        <div className={styles.dbBarChart}>
          {weeklyData.map((d) => {
            const barH = d.reps > 0 ? Math.round((d.reps / maxReps) * BAR_MAX_HEIGHT) : 0;
            return (
              <div key={d.day} className={styles.dbBarCol}>
                <span className={styles.dbBarCount}>{d.reps}</span>
                <div className={styles.dbBarWrap}>
                  {d.reps > 0 ? (
                    <>
                      <div
                        className={`${styles.dbBar} ${styles.dbBarPushup}`}
                        style={{ height: `${Math.round(barH * 0.5)}px` }}
                      ></div>
                      <div
                        className={`${styles.dbBar} ${styles.dbBarSquat}`}
                        style={{ height: `${Math.round(barH * 0.5)}px` }}
                      ></div>
                    </>
                  ) : (
                    <div style={{ height: `${BAR_MAX_HEIGHT}px` }}></div>
                  )}
                </div>
                <span className={styles.dbBarDay}>{d.day}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.dbLegend}>
          <div className={styles.dbLegendItem}>
            <span className={`${styles.dbLegendDot} ${styles.dbLegendDotBlue}`}></span>
            Push-ups
          </div>
          <div className={styles.dbLegendItem}>
            <span className={`${styles.dbLegendDot} ${styles.dbLegendDotCyan}`}></span>
            Squats
          </div>
        </div>
      </section>

      {/* EARNED BADGES */}
      <section className={styles.dbBadgesSection}>
        <h2 className={`${styles.dbSectionTitle} ${styles.dbSectionTitleAmber}`}>Earned Badges</h2>
        <div className={styles.dbBadgesGrid}>
          {earnedBadges.map((b) => (
            <div key={b.id} className={styles.dbBadgeCard}>
              <span className={styles.dbBadgeIcon}>{b.icon}</span>
              <span className={styles.dbBadgeName}>{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LOCKED BADGES */}
      <section className={`${styles.dbBadgesSection} ${styles.dbBadgesSectionLocked}`}>
        <h2 className={`${styles.dbSectionTitle} ${styles.dbSectionTitleViolet}`}>Locked Badges</h2>
        <div className={`${styles.dbBadgesGrid} ${styles.dbBadgesGridLocked}`}>
          {lockedBadges.map((b) => (
            <div key={b.id} className={`${styles.dbBadgeCard} ${styles.dbBadgeCardLocked}`}>
              <span className={styles.dbBadgeIcon}>{b.icon}</span>
              <span className={`${styles.dbBadgeName} ${styles.dbBadgeNameLocked}`}>{b.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
