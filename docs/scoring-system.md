# Altus Scoring System — Frontend vs Backend

This document explains why Altus has **two different scores** in the workout flow, where each one lives, and why they are never meant to match. Use it as reference material (and demo-day talking points) when explaining the scoring architecture.

> **Status:** Section 1 (in-game score) is already implemented. Section 3 (the `reps_completed`/`duration_seconds` wiring to the backend, including `src/api/workoutSessions.tsx`) is the agreed target design and is being implemented — check those files exist before citing them as current behavior.

---

## The short version

- The number you see **during and right after gameplay** is a local, client-side arcade score. It exists to make the game feel exciting in the moment.
- The number that gets **saved to the database** — and the only number that counts for badges and the leaderboard — is computed independently by the backend from the raw reps MediaPipe detected.
- The frontend's in-game score is **never sent to the backend and never trusted**. This is deliberate: it closes off the obvious cheat vector of editing the game's score in dev tools.

---

## 1. Frontend score (in-game, cosmetic)

Computed entirely client-side in [`src/engine/DinoRunGameEngine.ts`](../src/engine/DinoRunGameEngine.ts), in `scoreBreakdown()`:

```ts
const repStreak     = Math.max(1, score * 0.1);
const timeMult       = Math.pow(1.1, Math.floor(sessionTime) * 0.1);
const diffMult       = difficulty.scoreMultiplier;      // easy=1, medium=2, hard=3
const closeCallMult  = Math.min(1 + closeCallCount * 0.1, 1.5);

finalScore = Math.round(score * 100 * repStreak * timeMult * diffMult * closeCallMult);
```

Where `score` in this formula is the engine's **internal obstacle counter** — it increments once per obstacle the dino successfully clears, not once per squat detected. A mistimed squat is still a real rep, but it won't bump this number if the dino gets hit.

Why it's built this way:

- It rewards streaks, pace, difficulty, and near-misses — good game feel, bad fitness metric.
- It reacts instantly, with no network round trip, so the player gets immediate feedback.
- There is no separate XP system — `finalScore` is the only number the game produces.

This score is displayed in `GameResultModal` and then **discarded** — it is not part of the `POST /workout_sessions` payload and has no column in the database.

---

## 2. Backend score (authoritative, persisted)

Computed server-side, from raw data the frontend sends. Per [`docs/API-specifications.md`](./API-specifications.md):

```
score            = reps_completed × score_multiplier   (from exercise_difficulties)
calories_burned  = reps_completed × calories_per_rep    (from exercises)
```

This is the score that:

- Gets stored in `workout_sessions.score` (see [`docs/database-design.md`](./database-design.md)).
- Drives the leaderboard and workout history.
- Determines which achievements unlock (`achievements.requirement_type` / `requirement_value` reference this data, not the frontend's number).

The frontend never computes or sends this value — it only sends the raw inputs the formula needs.

---

## 3. What actually gets sent to the backend

`POST /workout_sessions` only ever receives:

| Field | Source |
|---|---|
| `exercise_difficulty_id` | Chosen on the Level screen, carried through navigation state |
| `reps_completed` | A dedicated counter listening directly to MediaPipe's `mv:squat:start` event — one real detected squat, one rep. **Not** the engine's obstacle-clear counter. |
| `duration_seconds` | The engine's session timer (`sessionTime`), which only accrues while the game is in its active `ACTIVE` state |

No score of any kind is ever included in this request. The backend computes it independently from `reps_completed` and looks up the multiplier itself — a tampered request body cannot change the stored score, because the backend never reads a client-sent score.

---

## 4. Why the two scores are allowed to disagree

This is intentional, not a bug or a missing feature:

- **Different purposes.** The in-game score is a real-time gameplay affordance. The backend score is the fair, comparable, tamper-resistant record used for badges and rankings.
- **Client-predicted, server-authoritative.** This is the same pattern most games with any server component use — show the player something responsive immediately, reconcile against the trusted value afterward.
- **Security, not obfuscation.** Making the two formulas match wouldn't add any protection — a tampered client could still fake either one. The actual guarantee comes from the backend never trusting a client-sent score at all, full stop.

There is intentionally no "per-game" score table on the backend either. The backend only knows about `exercises` (e.g. Squats) — it has no concept of "Dino Hopper" or its close-call/streak mechanics. Any future minigame that maps to an existing exercise reuses the exact same `reps_completed` + `duration_seconds` contract with zero backend changes. Coupling the schema to one game's scoring gimmick would break that.

---

## 5. Demo-day framing

If asked "is the game score ever stored?" or "why don't the numbers match?":

> "The number during gameplay is a real-time arcade score — it rewards streaks, speed, and near-misses to keep the game fun to play. It's calculated entirely client-side and never sent to the backend. What actually gets saved is the rep count MediaPipe detected plus the session duration — the backend independently computes the official score from that, and that's what counts toward badges and the leaderboard. Even if someone tampered with the game in dev tools to fake a huge in-game score, it wouldn't matter — the server never trusts or even sees that number."

---

## Related files

- [`src/engine/DinoRunGameEngine.ts`](../src/engine/DinoRunGameEngine.ts) — in-game score formula
- [`src/mediapipe/squatDetector.tsx`](../src/mediapipe/squatDetector.tsx) — source of truth for a detected rep (`mv:squat:start`)
- [`src/pages/Game/Game.tsx`](../src/pages/Game/Game.tsx) — where reps/duration are captured and sent
- [`src/api/workoutSessions.tsx`](../src/api/workoutSessions.tsx) — `POST /workout_sessions` client
- [`docs/API-specifications.md`](./API-specifications.md) — backend scoring formula
- [`docs/API-mapping-plan.md`](./API-mapping-plan.md) — overall frontend/backend integration plan
- [`docs/database-design.md`](./database-design.md) — `workout_sessions.score` column
