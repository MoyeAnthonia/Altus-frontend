const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type WorkoutSessionPayload = {
  exercise_difficulty_id: string;
  reps_completed: number;
  duration_seconds: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  badge_image: string | null;
  unlocked_at: string;
};

export type WorkoutSessionResult = {
  id: string;
  score: number;
  calories_burned: number;
  completed_at: string;
  new_achievements: Achievement[];
};

export async function saveWorkoutSession(
  token: string,
  payload: WorkoutSessionPayload,
): Promise<WorkoutSessionResult> {
  const response = await fetch(`${BASE_URL}/v1/workout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Failed to save workout session");
  }
  return response.json();
}
