const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Achievement = {
  id: string;
  name: string;
  description: string;
  badge_image: string | null;
  unlocked_at: string;
};

export async function getAchievements(token: string): Promise<Achievement[]> {
  const response = await fetch(`${BASE_URL}/v1/users/me/achievements`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Failed to load achievements");
  }

  return response.json();
}
