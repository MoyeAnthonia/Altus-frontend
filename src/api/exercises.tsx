const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type ExerciseDifficulty = {
  id: string;
  level_name: string;
  target_reps: number;
  score_multiplier: number;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  calories_per_rep: string;
  difficulties: ExerciseDifficulty[];
};

export async function getExercises(token: string): Promise<Exercise[]> {
  const response = await fetch(`${BASE_URL}/v1/exercises`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errr ?? "Failed to load exercises");
  }
  return response.json();
}
