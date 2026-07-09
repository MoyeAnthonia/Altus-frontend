# Altus Lesson Log

This file captures the main concepts we discussed while mapping the frontend to the backend.
It is written as a study note so you can come back to it later and follow the reasoning, not just copy code.

---

## 1. What the frontend is doing today

### Question
What is the current frontend flow?

### Answer
The app already has:
- authentication
- navigation between screens
- a workout selection page
- a difficulty selection page
- a game screen

Right now, most of the workout data is still hardcoded. The auth flow stores the token and user in `AuthContext`, but the exercise list from the backend is not wired in yet.

### Why this matters
Before changing anything, you need to understand what is already static and what should become backend-driven later.

---

## 2. API mapping plan

### Question
Why create an API mapping plan document first?

### Answer
Because the backend and frontend need to agree on:
- what data exists
- where that data comes from
- when it is fetched
- which screen uses which fields

For this project, the important backend flow is:
- login
- fetch exercises
- choose squat difficulty
- send session results
- let the backend calculate score and achievements

### Why this matters
A plan keeps the implementation focused and prevents random UI-first coding.

---

## 3. Step 1: Create the exercises API client

### Question
What is the first code step?

### Answer
Create a file like `src/api/exercises.ts` that knows how to call `GET /exercises`.

It should contain:
- `ExerciseDifficulty` type
- `Exercise` type
- `getExercises(token)` function

Example shape:

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

### Why this matters
This file is the bridge between frontend and backend. If you do not know the backend shape, you cannot store or pass the right ids later.

---

## 4. The `??` operator

### Question
What does `??` mean?

### Answer
`??` is the nullish coalescing operator.

It means:
- use the value on the left if it is not `null` or `undefined`
- otherwise use the value on the right

Example:

```ts
throw new Error(error.error ?? "Failed to load exercises");
```

This means:
- if the backend sent a useful error message, use it
- otherwise show the default message

### Why this matters
It gives the frontend a safe fallback message.

---

## 5. `useCallback`, `useMemo`, and `useEffect`

### Question
Why do these hooks seem similar?

### Answer
They solve different problems:

- `useEffect` runs side effects.
- `useCallback` remembers a function.
- `useMemo` remembers a computed value.

### `useEffect`
Use it when something should happen after render.

Example:
- fetch exercises after login
- subscribe to events
- sync state

### `useCallback`
Use it when you want the same function reference between renders.

Example:
- `refreshExercises` in a context
- passing a function into a dependency array

### `useMemo`
Use it when you want the same computed value between renders.

Example:
- the context `value` object

### Why this matters
Without them, React can recreate functions and objects on every render, which can cause extra re-renders or repeated effects.

---

## 6. What “every render” means

### Question
What does “every render” mean in React?

### Answer
A render happens when React runs the component function again because:
- state changed
- props changed
- the parent re-rendered

If you do not use `useCallback` or `useMemo`, React often creates new function and object references on each render.

### Why this matters
React compares references. A new function or object can make dependencies look changed even when the actual data is the same.

---

## 7. Shared exercises context

### Question
Why create `ExercisesContext`?

### Answer
`AuthContext` knows who is logged in and stores the token.
`ExercisesContext` should store the exercise data fetched from the backend.

This separation keeps the app clean:
- auth state stays in auth
- exercise data stays in exercises context

### What the context does
- reads the token from `AuthContext`
- fetches exercises after login
- stores them in React state
- clears them on logout

### Why this matters
The workout screen and difficulty screen can reuse the same backend data without refetching it.

---

## 8. Why some exercises stay hardcoded for now

### Question
Why not make every workout dynamic now?

### Answer
Because only squats are part of the working backend flow right now.
The other exercises are future placeholders.

### Why this matters
You can keep the current UI stable while wiring only the working squat path to backend ids.

---

## 9. Main implementation order

### Question
What should be built next, in order?

### Answer
1. Create the exercises API helper.
2. Create the exercises context.
3. Wrap the app in the provider.
4. Use the exercises data in the squat flow.
5. Pass exercise and difficulty ids through the game flow.
6. Save the session using raw workout results.

### Why this matters
This order keeps the work small and understandable.

---

## 10. Current lesson summary

### What I should remember
- API client first, UI second.
- Backend ids matter more than display labels.
- Auth state and exercise state should be separate.
- `useEffect` runs code, `useCallback` remembers functions, `useMemo` remembers values.
- `??` provides a fallback when a value is missing.

---

## 11. Notes for later

- Keep future workout cards static until they are part of the backend flow.
- Use the backend response as the source of truth for squat difficulty ids.
- When session saving is added, the backend should calculate score and achievements.

---

## 12. How the exercises fetch happens automatically

### Question
After login, how does the app know to call `GET /exercises`?

### Answer
It does not happen in the login screen directly.

The flow is:

```text
Login.tsx
  -> calls loginUser(email, password)
  -> gets token + user from the backend
  -> calls login(result.token, result.user)

AuthContext.tsx
  -> stores token and user in React state
  -> updates isAuthenticated to true

main.tsx
  -> wraps the app in AuthProvider and ExercisesProvider

ExercisesContext.tsx
  -> sees token / isAuthenticated change
  -> useEffect runs
  -> calls refreshExercises()
  -> refreshExercises calls getExercises(token)

api/exercises.ts
  -> sends GET /exercises with Authorization: Bearer <token>
```

### Why this matters

- The login screen only handles authentication.
- The exercises provider watches the auth state and reacts to it.
- This keeps the code separated and avoids calling the exercises API manually from the login form.

### Main files involved

- [src/pages/Login/Login.tsx](src/pages/Login/Login.tsx)
- [src/api/auth.tsx](src/api/auth.tsx)
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx)
- [src/main.tsx](src/main.tsx)
- [src/context/ExercisesContext.tsx](src/context/ExercisesContext.tsx)
- [src/api/exercises.tsx](src/api/exercises.tsx)

### One-line summary

Login succeeds first, auth state changes, the exercises provider notices that change, and then it fetches the squat exercise data automatically.

---

## 13. Passing data through React Router navigation state

### Question
How does `exerciseDifficultyId` actually get from the Level screen to the Game screen?

### Answer
`nav("/exercise", { state: { difficulty, exerciseDifficultyId } })` in `Level.tsx`, then `useLocation()` in `Game.tsx` reads that same `state` back out. `ExercisePage` and `GamePage` both render on the `/exercise` route, so `GamePage` can call `useLocation()` itself and get the same state — no prop drilling between the two components needed.

### Why this matters
The id has to travel from where it's known (Level, which has the backend exercise data) to where it's needed (Game, at `onGameEnd`) without a refetch. Route state is the simplest way to do that for a one-time handoff.

---

## 14. JS object shorthand property gotcha

### Question
Why did `{ canvas, activeDifficulty }` cause a type error in `Game.tsx`?

### Answer
`{ activeDifficulty }` is object shorthand for `{ activeDifficulty: activeDifficulty }` — it creates a key with the exact same name as the variable. But `DinoRunGameOptions` expects a key called `difficulty`, not `activeDifficulty`. Renaming a local variable doesn't rename the field the API/options type expects.

### Why this matters
Whenever a local variable's name doesn't match the field name the function/type expects, you must write the key explicitly: `{ difficulty: activeDifficulty }`. Shorthand only works when the names already match.

---

## 15. `useEffect`: dependency array vs. cleanup function

### Question
If the dependency array is `[]`, does the effect only run once — does that mean we can only count one repetition?

### Answer
Two separate things:
- The dependency array controls how many times the **setup code** runs. `[]` means "run once, when the component mounts, never again."
- That setup code can attach an **event listener**, which is ongoing — it fires every time the event happens, not just once. So the rep counter's listener can fire 15+ times in one game even though the effect that attached it only ran once.

The `return () => ...` inside a `useEffect` is a **cleanup function**. React calls it automatically right before the component unmounts (or before re-running the effect again, if dependencies had changed). For the rep counter, cleanup removes the same listener that was added.

### Why this matters
`window` outlives any single component instance. Without cleanup, every remount (e.g. every retry) would stack a new listener on top of old ones that were never removed — a leak, and a source of bugs if the leftover listener ever touches `setState`.

---

## 16. `useRef` vs `useState` — when to use which

### Question
Why is the rep counter a `useRef` and not a `useState`?

### Answer
`useState` triggers a re-render every time it changes. `useRef` just holds a mutable value across renders without causing one. The rep count doesn't need to show up live on screen — it's only read once, at the moment the game ends — so `useRef` avoids dozens of wasted re-renders during a single run.

### Why this matters
General rule: if a value needs to appear in the UI, use `useState`. If it's just bookkeeping you'll read later, use `useRef`.

---

## 17. MediaPipe and the game are decoupled through events, not imports

### Question
Is the game actually decoupled from MediaPipe, or is everything mixed together?

### Answer
Three layers, connected only by `window` `CustomEvent`s, never by direct imports:
1. `mediapipePlayer.tsx` — owns the camera + pose model, dispatches a generic `"mv:pose"` event with raw landmarks. Knows nothing about squats or games.
2. `squatDetector.tsx` / `jumpDetector.tsx` — listen to `"mv:pose"`, interpret it as "a squat/jump happened," and dispatch their own events (`"mv:squat:start"`, `"mv:jump"`). Know nothing about the game.
3. `DinoRunGameEngine.ts` — has zero imports from `src/mediapipe/`. It only does `window.addEventListener('mv:squat:start', ...)`, and that handler calls the exact same `handleJump()` a keyboard press would call.

### Why this matters
Because the coupling is just an event name on `window`, any number of independent listeners can react to the same detector event — e.g. the rep counter in `Game.tsx` listens to `"mv:squat:start"` for its own purpose, with zero knowledge of the game engine also listening to it. This is what makes it possible to swap games or add new listeners without touching the detector code.

---

## 18. Frontend score vs. backend score

### Question
Why does the game show one score and the backend compute a different one?

### Answer
The in-game number (`finalScore` in `DinoRunGameEngine.ts`) is a client-side arcade formula — reps × streak × time × difficulty × close-calls — built for gameplay feel and instant feedback. The backend computes its own, much simpler score (`reps_completed × score_multiplier`) independently from the raw reps sent in `POST /workout_sessions`, and that's the only one ever stored. The frontend's number is never sent to the backend and never trusted.

### Why this matters
This is intentional, not a bug: it's what makes the score tamper-resistant (the backend never reads a client-computed score, so editing the game in dev tools can't inflate a saved result). Full write-up: [docs/scoring-system.md](./scoring-system.md).

---

## 19. Diagnosing the "squat to retry" bug

### Question
Why does the game sometimes restart on its own, and does that mean the session doesn't get saved?

### Answer
`"mv:squat:start"` is overloaded in the engine to mean four different things depending on state: start from idle, retry from game-over, retry from win, or jump during active play. On the results screen, any accidental squat detected — easy to trigger since the player is standing a few feet from the camera — silently restarts the game with no confirmation.

This is a UX bug, not a save bug: `onGameEnd` fires the instant the round ends, before any retry gesture, so once the backend POST is wired up it already fires reliably regardless of this issue. What's actually broken is that the results screen disappears too fast to read and there's no deliberate "yes, save this" moment.

### Why this matters
Fix is to stop overloading one gesture for everything — see the next entry.

---

## 20. Plan: thumbs up / thumbs down as deliberate confirmation gestures

### Question
Can we use thumbs up/down instead of squats to start the game and to confirm retry vs. save-and-exit?

### Answer
The current pipeline only loads MediaPipe's **Pose** model, which gives one rough point per thumb/wrist — not enough resolution to reliably tell thumbs-up from thumbs-down. Plan is to add MediaPipe's dedicated **Gesture Recognizer** task instead (same `@mediapipe/tasks-vision` package already installed, no new dependency), which has real hand tracking and built-in `Thumb_Up`/`Thumb_Down` categories.

Plan, in order:
1. Expose the shared `<video>` element from `mediapipePlayer.tsx` so a second detector can reuse the same camera stream.
2. New `src/mediapipe/gestureDetector.tsx`, same confirm-frames + cooldown pattern as `squatDetector.tsx`, dispatching `"mv:thumb:up"` / `"mv:thumb:down"`.
3. Test standalone (console.log only) at real gameplay distance from the camera before touching the engine — hand-gesture models are usually tuned for closer range, so this needs verifying first.
4. Only after that's confirmed reliable: replace the squat-triggered `IDLE→CALIBRATING` and `GAME_OVER/WIN→restart` branches in the engine with thumbs-up, add a thumbs-down branch that triggers save-and-exit, update `GameIdleModal`/`GameResultModal` copy, and add an explicit manual "Save" button as a fallback.

### Why this matters
Avoids repeating the same one-gesture-does-everything mistake that caused the retry bug, and matches how far the player actually stands from the device.

---

*From here on, entries are grouped by topic name instead of a running lesson number.*

---

## Designing an API client function from scratch

### Question
How do you decide how to write a new `api/*.tsx` file — where do you even start?

### Answer
A repeatable checklist, not something invented per file:
1. Find the exact contract in the API spec first — method, path, whether it needs auth, the request body shape, the response body shape. Don't write code before you can answer all of these.
2. Check whether existing `api/*.tsx` files already establish a pattern (base URL variable, header style, error-handling shape) and reuse it rather than inventing something new. `workoutSessions.tsx` ended up as a hybrid of `auth.tsx` (POST + JSON body) and `exercises.tsx` (needs the auth header).
3. Decide what the function needs as parameters — anything it can't discover on its own (the token, since a plain `.tsx` module can't call `useAuth()`; the payload data, since the function doesn't know what game was played).
4. Define types that mirror the wire format field-for-field — same names, same casing as the spec. This is the frontend/backend boundary, so getting it right here gives type safety to everything downstream for free.
5. Write the function signature (inputs → output) before writing the body.
6. Implement it, checking `response.ok` manually — `fetch` does not throw on a 400/404/500, only on true network failure.

### Why this matters
This is the same six steps for any new endpoint client, not just this one — a framework you can explain and repeat, not a one-off recipe.

---

## Calling an `async` function without `await` ("fire and forget")

### Question
`saveWorkoutSession` is declared `async`. Why do we call it without `await` inside `onGameEnd`?

### Answer
`async` only guarantees the function returns a `Promise` — it does not force whoever calls it to wait. `await` is a separate, optional choice made at the call site. Not awaiting means: "start this now, but don't pause here for the result." That's fine when nothing that runs immediately after the call depends on the outcome — here, `setGameResult(result)` needs to show the results modal right away, and nothing on screen currently needs the backend's response first.

Even without `await`, the `.catch(...)` chained onto the call is still doing real work: if the request fails and nothing handles that rejection, it becomes a silent "unhandled promise rejection" instead of a caught error you can log.

### Why this matters
This pattern — call, don't await, but still `.catch()` — is called "fire and forget," and it's the right shape for a side effect the UI doesn't need to block on. The moment you *do* need the result for something afterward (e.g. reading `score`/`calories_burned`/`new_achievements` off the response to display verified badges), that's the signal to switch to `await` (marking the enclosing function `async`) or a `.then(...)` — which is exactly the shape the badges/score display step will need later.
