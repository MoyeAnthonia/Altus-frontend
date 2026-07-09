import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import { getExercises, type Exercise } from "../api/exercises";

type ExercisesContextType = {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  refreshExercises: () => Promise<void>;
};

export const ExercisesContext = createContext<ExercisesContextType | null>(null);

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshExercises = useCallback(async () => {
    if (!token) {
      setExercises([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await getExercises(token);
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exercises");
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setExercises([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void refreshExercises();
  }, [isAuthenticated, refreshExercises]);

  const value = useMemo(
    () => ({ exercises, isLoading, error, refreshExercises }),
    [exercises, isLoading, error, refreshExercises],
  );
  return <ExercisesContext.Provider value={value}>{children}</ExercisesContext.Provider>;
}
