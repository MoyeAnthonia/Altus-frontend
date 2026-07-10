# Altus API Mapping Plan

This document is the working plan for connecting the frontend workout flow to the backend API.

Use it as the reference while implementing the frontend changes step by step. Update the checklist and notes as the implementation changes.

---

## Goal

When a user logs in, the frontend should:

1. Fetch the backend data for the working squat exercise.
2. Keep the future workout cards static for now.
3. Let the user choose the squat difficulty.
4. Carry the selected `exercise_id` and `exercise_difficulty_id` into the game flow.
5. Send only raw workout results to the backend when the session ends.
6. Let the backend calculate score, calories, and badge unlocks.

---

## Backend Contract We Are Mapping To

### Relevant endpoints

- `POST /auth/login`
- `POST /auth/register`
- `GET /exercises`
- `POST /workout_sessions`
- `GET /workout_sessions/me`
- `GET /users/me/achievements`

### Key response/data rules

- `GET /exercises` returns exercises with nested difficulty presets.
- Only the squat exercise is part of the current working flow.
- Future exercises can stay hardcoded in the UI until they are ready.
- Each squat difficulty has its own `id`, which becomes the `exercise_difficulty_id` used later.
- The frontend should not send a computed score when saving a session.
- The backend should calculate score and badge unlocks after `POST /workout_sessions`.

---

## Planned Frontend Flow

### 1. User logs in

What happens:

- The auth request returns a JWT and user object.
- The JWT is stored in the auth state.

Why this matters:

- The exercises endpoint is protected, so the frontend needs the token before it can fetch the exercise list.

---

### 2. Fetch exercises once after login

What happens:

- The frontend calls `GET /exercises` one time after authentication.
- The result is cached in a shared React state layer.
- The app reads the squat exercise and its nested difficulties from that response.

Why this matters:

- The squat flow needs one source of truth for exercise and difficulty ids.
- Fetching once avoids duplicate network calls and keeps the UI consistent.

---

### 3. Render the workout selection screen from backend data

What happens:

- The workout screen keeps the future workout cards hardcoded.
- The working squat card uses backend data once it is available.

Why this matters:

- The frontend can keep future work visible without blocking the current squat integration.

---

### 4. Let the user choose a difficulty for the selected exercise

What happens:

- The selected squat exercise is carried into the difficulty screen.
- The difficulty screen renders the nested difficulty presets from the squat response.

Why this matters:

- Each squat difficulty has a unique backend ID.
- That ID is what must be saved later, not just the display name like Easy or Medium.

---

### 5. Pass the selected exercise and difficulty through navigation state

What happens:

- The squat exercise and selected difficulty are passed to the next screen.
- The game screen receives the identifiers it needs to know what the user picked.

Why this matters:

- The game should not guess which workout was chosen.
- This keeps the flow simple and avoids extra refetching.

---

### 6. Save the workout session at the end

What happens:

- When the run ends, the frontend sends the raw workout result to `POST /workout_sessions`.
- The request should include the selected squat `exercise_difficulty_id`, `reps_completed`, and `duration_seconds`.

Why this matters:

- The backend calculates the authoritative score and calorie burn.
- The backend also decides whether new achievements were unlocked.

---

### 7. Show the backend result in the UI

What happens:

- The response from `POST /workout_sessions` can be used to show score, calories, and unlocked achievements.

Why this matters:

- The frontend should display the backend result, not a separate locally computed final score.

---

## Step-By-Step Implementation Checklist

### Step 1 details: create the exercises API client

Create this file:

- [src/api/exercises.ts](src/api/exercises.ts)

Create this function:

```ts
export async function getExercises(token: string): Promise<Exercise[]>;
```

Add these types in the same file:

```ts
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
  calories_per_rep: number;
  difficulties: ExerciseDifficulty[];
};
```

What the function should do:

- Read `VITE_API_BASE_URL` the same way the auth client does.
- Call `GET /exercises`.
- Send `Authorization: Bearer <token>` in the request headers.
- Throw a readable error if the response is not OK.
- Return the JSON response as an `Exercise[]`.

Why this is the first thing to build:

- The backend response is the source of truth for the squat exercise ids.
- The workout and difficulty screens cannot use backend ids until this exists.
- This file keeps the API logic separate from the UI, which makes the next steps easier.

How to verify Step 1:

- The file exists at [src/api/exercises.ts](src/api/exercises.ts).
- The file exports `Exercise`, `ExerciseDifficulty`, and `getExercises`.
- No UI files need to change yet.

### Step 1: Add an exercises API client

- [ ] Create a frontend API helper for `GET /exercises`.
- [ ] Make sure it sends the auth token.
- [ ] Define frontend types for the squat exercise and its nested difficulties.

### Step 2 details: create shared exercises state

Create this next because the login token already exists in auth state, but the exercise data still needs a place to live after it is fetched.

What to create:

- A React context or custom hook for exercises.
- A `refreshExercises()` function that uses the token from auth state.
- A place to store the fetched squat exercise response.

Why this step exists:

- `AuthContext` only tells us who is logged in and gives us the token.
- The exercise data is a separate piece of data, so it should not live inside auth state.
- If you fetch exercises directly inside multiple screens, you will repeat the request and make the flow harder to reason about.
- Shared state lets the app fetch once and reuse the same squat data in the workout screen, difficulty screen, and game flow.

How it should work:

- After login, the shared state checks whether a token exists.
- If there is a token, it calls `getExercises(token)`.
- The returned squat exercise is stored in memory for the rest of the session.
- When the user logs out, the shared exercise data should be cleared.

Why clearing on logout matters:

- It prevents one logged-in user’s exercise data from staying visible after logout.
- It keeps the state aligned with the token, which avoids stale or misleading UI.

Checklist:

- [ ] Create a context or hook that stores the fetched exercises.
- [ ] Fetch the exercise list once after login.
- [ ] Clear the cache on logout.
- [ ] Make the shared state use the auth token from `AuthContext`.

Suggested files:

- [src/context/ExercisesContext.tsx](src/context/ExercisesContext.tsx)
- [src/context/useExercises.tsx](src/context/useExercises.tsx)

How to verify Step 2:

- The app only fetches exercises after login.
- The squat response is available to any screen that needs it.
- Logging out clears the cached exercises.

### Step 3: Update workout selection UI

- [ ] Keep the future workout cards hardcoded for now.
- [ ] Wire the working squat card to the backend exercise response.
- [ ] Keep a fallback UI for unauthenticated users if needed.

### Step 4: Update difficulty selection UI

- [ ] Read the selected squat exercise from navigation state or shared state.
- [ ] Render that exercise’s nested difficulties.
- [ ] Pass the chosen difficulty ID to the next route.

### Step 5: Update the game/session end flow

- [ ] Store the selected `exercise_difficulty_id` in the game flow.
- [ ] Send the session save request when the workout ends.
- [ ] Use the backend response for score and achievements.

### Step 6: Update profile/history screens later

- [ ] Use `GET /workout_sessions/me` for workout history.
- [ ] Use `GET /users/me/achievements` for unlocked badges.

---

## Data Mapping Notes

### Exercise response

The frontend should expect the squat exercise response to look like this:

```json
{
  "id": "uuid",
  "name": "Squats",
  "description": "Standard squat exercise",
  "calories_per_rep": 0.32,
  "difficulties": [
    {
      "id": "uuid",
      "level_name": "Easy",
      "target_reps": 5,
      "score_multiplier": 1.0
    }
  ]
}
```

### Session save request

The frontend should send only this kind of payload:

```json
{
  "exercise_difficulty_id": "uuid",
  "reps_completed": 15,
  "duration_seconds": 60
}
```

### Session save response

The backend response should drive the final result display:

```json
{
  "id": "uuid",
  "score": 630,
  "calories_burned": 13.44,
  "completed_at": "2025-06-01T10:30:00.000Z",
  "new_achievements": []
}
```

---

## Open Questions

- Should the squat exercise be cached in shared state, or passed only through route state?
- Should the game screen send the save request directly, or should a parent page own that responsibility?
- When future exercises are ready, should they follow the same shared-state pattern or a separate flow?

---

## Update Log

- 2026-07-08: Created initial mapping plan based on `docs/API-specifications.md`.
- 2026-07-08: Narrowed the plan to the current squat-only backend flow; future exercises stay static for now.
