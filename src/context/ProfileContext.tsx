import {
  createContext,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./useAuth";
import {
  getWorkoutSessions,
  type WorkoutSession,
  type WorkoutSessionsStats,
} from "../api/workoutSessions";
import { getAchievements, type Achievement } from "../api/achievements";

const defaultStats: WorkoutSessionsStats = {
  session_count: 0,
  total_reps: 0,
  total_calories: 0,
};

type ProfileContextType = {
  sessions: WorkoutSession[];
  stats: WorkoutSessionsStats;
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Build the providers internal state
  const { token, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WorkoutSessionsStats>(defaultStats);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Function that updates the state
  const refreshProfile = useCallback(async () => {
    if (!token) {
      setSessions([]);
      setStats(defaultStats);
      setAchievements([]);
      setError(null);
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [sessionsData, achievementsData] = await Promise.all([
        getWorkoutSessions(token),
        getAchievements(token),
      ]);
      setSessions(sessionsData.sessions);
      setStats(sessionsData.stats);
      setAchievements(achievementsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setSessions([]);
      setStats(defaultStats);
      setAchievements([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [token]);

  // When refreshProfile runs
  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setStats(defaultStats);
      setAchievements([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  // Package the state into one value and provide it
  const value = useMemo(
    () => ({ sessions, stats, achievements, isLoading, error, refreshProfile }),
    [sessions, stats, achievements, isLoading, error, refreshProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
