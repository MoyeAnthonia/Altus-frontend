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

- [x] Create a frontend API helper for `GET /exercises`.
- [x] Make sure it sends the auth token.
- [x] Define frontend types for the squat exercise and its nested difficulties.

Actual file: [src/api/exercises.tsx](../src/api/exercises.tsx) (`.tsx`, not `.ts` as originally planned).

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

- [x] Create a context or hook that stores the fetched exercises.
- [x] Fetch the exercise list once after login.
- [x] Clear the cache on logout.
- [x] Make the shared state use the auth token from `AuthContext`.

Same pattern was later reused for `SelectedGameContext` — see the Open Questions note below.

Suggested files:

- [src/context/ExercisesContext.tsx](src/context/ExercisesContext.tsx)
- [src/context/useExercises.tsx](src/context/useExercises.tsx)

How to verify Step 2:

- The app only fetches exercises after login.
- The squat response is available to any screen that needs it.
- Logging out clears the cached exercises.

### Step 3: Update workout selection UI

- [x] Keep the future workout cards hardcoded for now.
- [x] Wire the working squat card to the backend exercise response.
- [ ] Keep a fallback UI for unauthenticated users if needed. (not yet revisited)

### Step 4: Update difficulty selection UI

- [x] Read the selected squat exercise from navigation state or shared state.
- [x] Render that exercise's nested difficulties.
- [x] Pass the chosen difficulty ID to the next route.

Note: "navigation state" turned out to be the wrong home for the selected game/exercise — it only survives a single `nav()` call, and silently went blank after a full Level → Exercise → Game → Level round trip. Replaced with `SelectedGameContext` (same provider-scoped pattern as `ExercisesContext`), which is what actually made this step durable. See `docs/lesson-log.md`, "Route `state` vs. Context: two different lifetimes for the same kind of data."

### Step 5: Update the game/session end flow

- [x] Store the selected `exercise_difficulty_id` in the game flow.
- [x] Send the session save request when the workout ends.
- [x] **Decide how the backend response reaches the UI. Resolved — see below.**

**Decision:** `saveWorkoutSession` stays exactly as it is today — fire-and-forget, `.catch()`'d, never awaited, no UI reads its return value. `Game.tsx` does not need to change for this step.

Reasoning: the arcade score breakdown in `GameResultModal` (speed bonus, streak, close-calls) stays as-is — it's real per-round feedback, distinct from the backend's authoritative number, and there's no need to reconcile the two into one display. Rather than plumbing the `POST /workout_sessions` response through `Game.tsx`'s state, the authoritative score/calories/achievements are shown on the **Profile page**, which independently pulls `GET /workout_sessions/me` and `GET /users/me/achievements` (see Step 6). That means "use the backend response" is satisfied by Profile always showing fresh data, not by consuming the POST response body inline.

Also resolved: the dead `"mv:gameover"` listener + `GameOverModal` (`components/Modal/Modal.tsx`) in `Exercise.tsx` are **not** an earlier attempt at Profile-navigation worth reviving — they're a near-duplicate of `GameResultModal` (same fields: baseScore/repStreak/timeSeconds/finalScore) that predates the richer arcade breakdown and got orphaned when `GameResultModal` was built directly into `Game.tsx`. Nothing dispatches `"mv:gameover"`. To remove: `src/components/Modal/Modal.tsx`, its `.module.css`, the import in `Exercise.tsx`, and the dead `useEffect` listening for `"mv:gameover"` plus the unused `gameOverStats`/`GameOverModal` render block.

### Step 6: Wire Profile to real backend data

Resolved design (see Update Log 2026-07-10 for full discussion): Profile gets its own context, **separate from `ExercisesContext`**, combining sessions + achievements together.

- **Why not fold into `ExercisesContext`:** different refresh cadence. Exercises fetch once at login and never change again. Sessions/achievements need refreshing both at login *and* again after every completed game — folding them together would mean every post-game refresh needlessly re-fetches exercises too.
- **Why sessions + achievements combined instead of two contexts:** they share one consumer (the Profile page) and the backend already couples them — `new_achievements` comes back from the same `POST /workout_sessions` call that creates the session. One `refreshProfile()` firing both GETs (e.g. via `Promise.all`) means `Game.tsx` makes one refresh call post-game instead of two, and Profile gates on one loading/error state instead of two.

**Breaking change to handle:** `GET /workout_sessions/me` used to return a bare array of sessions. It now returns `{ sessions: [...], stats: { session_count, total_reps, total_calories } }`. Any fetch function must read `response.sessions`, not treat the response itself as the array.

Build sequence:

- [x] `src/api/achievements.tsx` — new file, owns the `Achievement` type (moved out of `workoutSessions.tsx`) + `getAchievements(token)`. (`.tsx`, not `.ts`, matching the Step 1 naming precedent.)
- [x] `src/api/workoutSessions.tsx` — imports `Achievement` from `achievements.tsx`, adds `getWorkoutSessions(token)` + `WorkoutSession`/`WorkoutSessionStats`/`WorkoutSessionResponse` types for the `{ sessions, stats }` response.
- [x] `src/context/ProfileContext.tsx` — same pattern as `ExercisesContext`: `sessions`, `stats`, `achievements`, `isLoading`, `error`, `refreshProfile()`. `stats` defaults to a `defaultStats` zero-object (not `null`), since an object can't default to `[]` the way arrays can.
- [x] `src/context/useProfile.tsx` — thin hook, same pattern as `useExercises.tsx`.
- [x] Wire `<ProfileProvider>` into `main.tsx` alongside the existing providers. Nested inside `AuthProvider` (needs the token) and grouped next to `ExercisesProvider`; order relative to `SelectedGameProvider` doesn't matter since neither depends on the other.
- [x] Call `refreshProfile()` again after a game ends. **Resolved:** Dashboard/Profile page calls `refreshProfile()` in its own `useEffect` on mount, not `Game.tsx` post-save — keeps `Game.tsx`'s only responsibility as running the game, and matches the existing "refetch when shown" pattern rather than "producer announces a change." Implemented in `src/pages/Dashboard/Dashboard.tsx`.
- [x] Remove dead `mv:gameover`/`GameOverModal` code (see Step 5 note above). Also removed `handlePlayAgain`/`handleGoToDashboard`/`gameKey` from `Exercise.tsx`, since they were only ever wired to the dead modal and had no other caller. Deleted `src/components/Modal/Modal.tsx` and `Modal.module.css` outright.
- [ ] Redesign the Dashboard UI itself to match real backend fields (drop the hardcoded streak stat, decide session-history display as table vs. graph) — explicitly deferred, data layer comes first.

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

The backend independently computes this and returns it from `POST /workout_sessions`. Per the Step 5 decision, the frontend does not consume this response body directly — it's informational only. The authoritative numbers reach the UI via Profile's own `GET` calls instead.

```json
{
  "id": "uuid",
  "score": 630,
  "calories_burned": 13.44,
  "completed_at": "2025-06-01T10:30:00.000Z",
  "new_achievements": []
}
```

### Workout history response (`GET /workout_sessions/me`)

**Breaking change:** previously a bare array. Now an object — read `response.sessions`, not `response`.

```json
{
  "sessions": [
    {
      "id": "uuid",
      "exercise": "Squats",
      "difficulty": "Medium",
      "reps_completed": 15,
      "score": 630,
      "duration_seconds": 60,
      "calories_burned": 13.44,
      "completed_at": "2025-06-01T10:30:00.000Z"
    }
  ],
  "stats": {
    "session_count": 1,
    "total_reps": 15,
    "total_calories": 13.44
  }
}
```

`stats` has no streak field — if Dashboard wants a streak stat, it'll need to be derived client-side from `completed_at` timestamps, or deferred until the backend exposes one. Not yet decided (see Step 6).

### Achievements response (`GET /users/me/achievements`)

```json
[
  {
    "id": "uuid",
    "name": "First Workout",
    "description": "Complete your first workout",
    "badge_image": null,
    "unlocked_at": "2025-06-01T10:30:00.000Z"
  }
]
```

---

## Open Questions

- ~~Should the squat exercise be cached in shared state, or passed only through route state?~~ **Resolved:** shared state (`ExercisesContext`). Route state proved too fragile even for the *selected game id*, not just exercise data — see Step 4 note above.
- ~~Should the game screen send the save request directly, or should a parent page own that responsibility?~~ **Resolved:** `Game.tsx` sends it directly from `onGameEnd`. Confirmed working via the Network tab.
- When future exercises are ready, should they follow the same shared-state pattern or a separate flow? (still open, not yet relevant)
- ~~Should completing a round navigate to Profile, or stay on the current flow with a "here's what was saved" line in the results popup?~~ **Resolved:** stay on the current flow for now; no in-modal line. Profile becomes the authoritative-data surface once Step 6's data layer lands, and post-game navigation to Profile is a later decision once that's in place. See Step 5/6 notes above.
- ~~One combined context for sessions + achievements, or fold into `ExercisesContext`, or split further?~~ **Resolved:** one new `ProfileContext` combining sessions + achievements, kept separate from `ExercisesContext`. See Step 6 reasoning above.
- ~~New question from Step 6: where should `refreshProfile()` get called after a game — from `Game.tsx` right after the save, or from Dashboard on mount?~~ **Resolved:** Dashboard/Profile page refreshes itself on mount. See Step 6 build sequence above.
- New question from Step 6: does Dashboard's streak stat get derived client-side from session timestamps, or wait for a backend field? Still open.

---

## Update Log

- 2026-07-08: Created initial mapping plan based on `docs/API-specifications.md`.
- 2026-07-08: Narrowed the plan to the current squat-only backend flow; future exercises stay static for now.
- 2026-07-10: Steps 1-4 confirmed complete. Step 5 partially done (session save works); score/achievements display is the next concrete task. Replaced route-state handoff of the selected game with `SelectedGameContext` after it caused a real bug (rep goals going blank after a full game round trip). Also fixed unrelated bugs found along the way: the squat gesture being overloaded for start/retry/jump/cancel all at once (split into `mv:confirm`/`mv:cancel`/`mv:squat:start`), and the camera/mediapipe resources never being torn down on navigation. See `docs/lesson-log.md` for the full reasoning on all of these.
- 2026-07-10: Resolved Step 5 — `saveWorkoutSession` stays fire-and-forget, no code change needed in `Game.tsx`; the backend response is not consumed inline. Resolved that the dead `mv:gameover`/`GameOverModal` code in `Exercise.tsx` is a superseded duplicate of `GameResultModal`, not an abandoned Profile-navigation feature — scheduled for removal, not revival. Backend API spec updated for `workout_sessions`: `GET /workout_sessions/me` now returns `{ sessions, stats }` instead of a bare array (breaking change). Decided Step 6's shape: a new `ProfileContext` combining sessions + achievements (different refresh cadence than `ExercisesContext`, so kept separate), fetched after login and refreshed again post-game. Dashboard redesign (drop hardcoded streak, decide table vs. graph for session history) explicitly deferred until the data layer is in.
