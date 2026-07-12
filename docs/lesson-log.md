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

**Confirmed in practice, and a second bug found alongside it:** testing showed the start-squat and retry-squat were both being counted by the rep counter as real reps (since `repCountRef` listens to every `"mv:squat:start"` with no way to tell "control" squats from "workout" squats apart). Separately, `Game.tsx`'s `handleRetry` rebuilds the engine in place without remounting `GamePage`, so `repCountRef` was never reset between rounds — reps kept accumulating round over round. The reset was a quick independent fix (`repCountRef.current = 0` at the top of `handleRetry`); the double-counting itself needed the gesture change below.

### Why this matters
Fix is to stop overloading one gesture for everything — see the next entry.

---

## 20. Confirm/cancel gestures instead of squats for start and retry (plan pivoted mid-build)

### Question
Can we use a gesture other than squats to start the game and to confirm retry vs. save-and-exit — and if so, which gesture?

### Answer
**Original plan:** thumbs up/down via MediaPipe's dedicated **Gesture Recognizer** task (real hand tracking, built-in `Thumb_Up`/`Thumb_Down` categories) — the existing **Pose** model only gives one rough point per thumb/wrist, not enough resolution to tell thumbs-up from thumbs-down reliably. Built `src/mediapipe/gestureDetector.tsx` for this and confirmed the model loaded and ran per-frame without errors.

**What actually happened when testing it:** no thumbs-up/down ever triggered. Debugging it surfaced a mix-up worth remembering on its own (see the new entry on this below) — the skeleton visible on screen is the Pose model's rough hand-region points (4 of them), not the Gesture Recognizer's real hand landmarks, which aren't drawn anywhere. Once that confusion was cleared up, the working theory was: hand-gesture models are tuned for a hand filling a good part of the frame (video calls, sign language), not a hand several feet from the camera in a full-body game setup.

**Pivoted to:** reusing the already-loaded Pose model instead of adding a second one — comparing wrist Y vs. shoulder Y (`src/mediapipe/armGestureDetector.tsx`), same confirm-frames + cooldown pattern as `squatDetector.tsx`, dispatching `"mv:confirm"` (right arm raised) / `"mv:cancel"` (left arm raised). Tested standalone via console log at real gameplay distance and both triggered reliably. This is what's actually being wired into the engine now, not the thumbs-up plan.

Remaining steps: replace the squat-triggered `IDLE→CALIBRATING` and `GAME_OVER/WIN→restart` branches in `DinoRunGameEngine.ts` with `"mv:confirm"`, add an `onExitRequested` callback fired by `"mv:cancel"` from `GAME_OVER`/`WIN` (wired to `Game.tsx`'s existing `handleExit`), then update `GameIdleModal`/`GameResultModal` copy. `gestureDetector.tsx` and the `getVideoElement()` export added to `mediapipePlayer.tsx` for the abandoned approach are unused but left in place for now.

### Why this matters
Avoids repeating the same one-gesture-does-everything mistake that caused the retry bug, matches how far the player actually stands from the device, and reuses a model already proven reliable at that distance instead of adding a second one tuned for a different use case.

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

---

## Two independent tracking models can look similar but aren't the same system

### Question
The on-screen skeleton only shows about 4 rough points near the hand — doesn't that prove hand-gesture detection (thumbs up/down) can't work?

### Answer
No — that skeleton is drawn by `mediapipePlayer.tsx`'s `drawConnectors`/`drawLandmarks` calls, and it only ever visualizes the **Pose** model's landmarks (33 whole-body points, ~4 of them near each hand). MediaPipe's `GestureRecognizer` is a completely separate model doing its own independent hand detection straight from the video — it has its own 21-point-per-hand tracking with full finger detail, and nothing in the code draws *its* output on screen. So the low-resolution skeleton you can see is not evidence about whether the higher-resolution model (that you can't see) is working.

### Why this matters
When two systems produce visually similar-looking output (both are "a skeleton over a video feed"), don't diagnose one by looking at the other's visualization. Get raw evidence directly from the system actually under test — e.g. a temporary `console.log` of the exact values it's producing — rather than inferring from a related-looking proxy. This is the same instinct as checking `git status`/reading a file directly instead of assuming from a summary.

---

## When does a bugfix deserve its own commit?

### Question
I fixed a bug while building a new feature (`repCountRef` not resetting on retry) — does that need a separate commit from the feature?

### Answer
Rule of thumb: **would you want to revert this fix independently of the feature it was found alongside, or vice versa?** If yes — they're conceptually unrelated — give the fix its own commit so it can be reverted or bisected on its own later. If the fix was only discoverable *because* of the feature being built, is small, and lives in the same file/function you were already touching, bundling it into the same commit is reasonable; splitting it would mean interactively staging hunks (`git add -p`) for very little benefit.

### Why this matters
Commit granularity is a judgment call, not a fixed rule — the deciding question is about future revert/bisect usefulness, not "is this technically two different changes."

---

## Splitting one overloaded gesture into purpose-built events

### Question
Why split `"mv:squat:start"` into three separate events (`"mv:squat:start"`, `"mv:confirm"`, `"mv:cancel"`) instead of just fixing the squat handler's logic?

### Answer
The original bug (see the "squat to retry" entry above) wasn't really a logic bug — the real problem was that one physical gesture (squat) meant four different things depending on game state: start, retry, jump, and implicitly "yes, restart." Any listener reacting to `"mv:squat:start"` had no way to know which meaning was intended in a given moment, because the event itself carries no information beyond "a squat happened."

The fix adds two new gestures — right arm raised (`"mv:confirm"`) and left arm raised (`"mv:cancel"`) — built on the same Pose model already loaded for squats (`armGestureDetector.tsx`, reusing the confirm-frames + cooldown pattern from `squatDetector.tsx`), and narrows the engine's squat handler to exactly one meaning: jump. `IDLE→CALIBRATING` and `GAME_OVER/WIN→restart` now listen for `"mv:confirm"`; a new `"mv:cancel"` handler, guarded to only fire from `GAME_OVER`/`WIN`, is exit-only.

### Why this matters
When one event means multiple things, every listener has to guess intent from state alone, and any accidental trigger still does *something* — just not necessarily the right thing. Splitting by intent, not by physical motion, means each event only ever means one thing everywhere it's heard.

---

## Adding a new engine callback: the `onExitRequested` pattern

### Question
How does `DinoRunGame` tell `Game.tsx` that the player wants to leave the results screen, without the engine knowing anything about routing?

### Answer
Same pattern as `onGameEnd`/`onGameStart`/`onGameIdle`: `DinoRunGameOptions` gained one more optional callback, `onExitRequested?: () => void`, defaulted to a no-op if not passed (`opts.onExitRequested ?? (() => {})`). The engine's `"mv:cancel"` handler just calls `this.onExitRequested()` when the game is over — it never calls `nav()` or knows `/level` exists. `Game.tsx` passes its own `handleExit` (which does `setGameResult(null); nav("/level");`) as that callback.

### Why this matters
This keeps the engine's only dependency on the outside world as "a handful of callbacks," the same boundary `onGameEnd` already established — the engine still has zero imports from React or React Router, and `Game.tsx` decides what "exit" actually means, not the engine.

---

## Word choice: "Retry" vs "Play Again"

### Question
Is "Retry" the right word for the results-screen button, given the previous round's result is already saved?

### Answer
No — `onGameEnd` fires and saves the workout session the instant the round ends, *before* the player does anything else. Pressing the button afterward doesn't undo or redo that save; it just boots a brand-new, independent `DinoRunGame` instance for a new session. "Retry" implies "try that attempt again," which isn't accurate — especially on the WIN path, where nothing failed. "Play Again" describes what's actually happening (start a new session) without implying anything about the old one.

### Why this matters
UI copy that implies the wrong mental model can make a player second-guess whether their score was actually saved, even when the save already happened independently of the button they're about to press.

---

## Fixing the camera-stays-on bug: "stop the camera" is actually three resources, not one

### Question
Why didn't the camera turn off when leaving the game page, even though `Game.tsx` and `ExercisePage` both unmount normally on navigation?

### Answer
`initMediaPipe()` (`mediapipePlayer.tsx`) starts three separate things, and none of them had any way to be stopped:
1. A `getUserMedia` **`MediaStream`** — the actual camera hardware access.
2. A **`requestAnimationFrame`** loop (`processFrame`) that re-schedules itself forever with no cancellation path.
3. A **`PoseLandmarker`** instance — holds WASM/GPU resources for pose detection.

Unmounting the React component that *started* these doesn't stop any of them, because none of the three live inside React at all — the hidden `<video>` element is appended straight to `document.body`, bypassing the component tree entirely, and the stream/rAF-loop/model are plain module-level variables. React's unmount only cleans up what React manages (component state, DOM nodes it rendered, effects it ran) — anything a `useEffect` reaches out and starts in the wider browser environment needs its own explicit teardown in that same effect's cleanup function.

The fix: store all three in module state, and export a `stopMediaPipe()` that stops the stream's tracks, `cancelAnimationFrame`s the loop, and `.close()`s the landmarker — then call it from `useMediaPipe.tsx`'s `useEffect` cleanup, which already runs on unmount.

### Why this matters
"Starting" a browser resource (camera, timers, sockets, animation loops) and "owning a React component that happened to start it" are two different lifetimes. Any time an effect reaches outside React to start something, the same effect's cleanup is responsible for stopping it — React won't do it automatically just because a component disappeared.

---

## Two independent camera streams can exist for the same feature

### Question
After fixing `mediapipePlayer.tsx`'s teardown, the camera indicator still stayed on after pressing back. Why?

### Answer
`ExercisePage`'s own `openCamera()` opens a **second, separate** `getUserMedia` stream — used only for the visible preview thumbnail (`videoRef`/`MotionCard`) — completely independent of the hidden stream `mediapipePlayer.tsx` uses for actual pose detection. Fixing one had no effect on the other; both had to be tracked (`streamRef`) and stopped (`.getTracks().forEach(t => t.stop())` in a cleanup effect) separately.

### Why this matters
When a bug report says "the camera," check whether there's actually more than one camera stream backing that feature before assuming one fix covers it. Grepping for every `getUserMedia` call in the codebase (not just the one file you expect) is what surfaced this.

---

## Module-level state persists across every mount — that's a feature and a trap

### Question
Why did calibration get "stuck" after fixing the camera teardown — the checklist just hung with nothing turning green?

### Answer
`squatDetector.tsx`'s `isCalibrated`, `baselineY`, and `calibrationSamples` are plain module-level `let`s, not React state — they live for the entire life of the page, across every mount/unmount of the components that use them. We *wanted* that: it's what lets a second play session skip the 4-second stand-still and reuse the first session's baseline.

But `"mv:calibrated"` — the only event that tells the UI "calibration is done" — was only ever dispatched from *inside* the one-time calibration block. Once `isCalibrated` was `true` from a previous session, that block never ran again, so the event never fired again, so a brand-new `ExercisePage` instance had no way to find out calibration had already happened. The fix: `initSquatDetector()` now checks `if (isCalibrated)` on startup and immediately re-dispatches `"mv:calibrated"` itself, so any fresh listener gets caught up right away instead of waiting for an event that already happened in a previous life of the module.

### Why this matters
This is the general shape of the bug, not a one-off: **whenever state lives outside a component (module scope, a singleton, a cache) but the UI only learns about it through events, "already true" and "just became true" need to be handled as two separate cases.** An event fired once, at the moment a value changes, only reaches listeners that already existed at that moment — any listener that starts existing later needs the current state actively re-announced to it, not just the next change.

---

## You can't `removeEventListener` an anonymous function

### Question
Why did every detector (`squatDetector.tsx`, `armGestureDetector.tsx`) need a named `handlePoseEvent` function instead of the inline arrow function they had before?

### Answer
`removeEventListener` only removes a listener if you pass the *exact same function reference* that was passed to `addEventListener`. An inline arrow function (`(e) => onSquatFrame(...)`) creates a brand-new function object every time it's written — even textually identical code — so there's no way to ever refer back to "that one" to remove it. Pulling it out to a named, module-level `function handlePoseEvent(e) {...}` gives both `addEventListener` and `removeEventListener` the same reference to point at.

### Why this matters
Any time a listener needs to be removable later, it can't be anonymous — this is a hard JS/DOM constraint, not a style preference. It's also what was silently causing the duplicate-listener stacking bug: every re-entry into the game called `initSquatDetector()` again, adding another anonymous listener with no way to ever clean up the previous one.

---

## Route `state` vs. Context: two different lifetimes for the same kind of data

### Question
The Level page's rep-goal numbers went blank after playing a round and returning — why, if the exercise data itself never left memory?

### Answer
Two different problems that look similar. The exercise data (`ExercisesContext`) was never the issue — it's a Provider wrapping the whole app in `main.tsx`, so it survives every navigation. What actually broke was `gameId`, which `Level.tsx` used to look up *which* exercise's difficulties to read out of that data. `gameId` was being passed through React Router's `nav(path, { state })` — and route `state` only exists for the single navigation call that set it. `Cards.tsx` set it once on the way *into* `/level`, but nothing carried it back out to `/exercise` and then back again through `Game.tsx`'s exit — so by the time the player returned to `/level`, `location.state` was empty and the lookup silently failed.

The fix wasn't to re-thread `gameId` through every intermediate screen (including `Game.tsx`, which has no actual use for it) — it was to give `gameId` the same kind of home the exercise data already has: a small `SelectedGameContext`, set once when a game card is clicked, read directly by `Level.tsx` whenever it needs it. No component in between has to know it exists or forward it along.

### Why this matters
Route `state` is a **one-time handoff**, scoped to a single `nav()` call — treat it like a value you're handing off for exactly one trip, not something that persists. Context (or anything provider-scoped above the router) is **long-lived**, matching the app's lifetime instead of one navigation. The tell for which one to use: if a value only needs to survive from screen A to the very next screen B, route state is fine (like `exerciseDifficultyId` going from Level to Game). If a value needs to survive arbitrary navigation back and forth — especially through screens that have no real use for it — it belongs in context instead, the same way `AuthContext`/`ExercisesContext` already do for auth and exercise data.

---

## Merging `dev` into a feature branch doesn't keep them independent — and can silently combine mismatched code

### Question
After merging `dev` into this branch (choosing "accept incoming" on conflicts) and pushing, the confirm-gesture-to-start flow broke — raising an arm kept snapping back to the start screen. `Game.tsx` looked the same on both branches when checked separately. What happened?

### Answer
Two misunderstandings stacked up:

1. **Merging `dev` in is the opposite of staying independent.** `git merge dev` pulls dev's commits into the current branch's history — after the merge, the branch contains the union of both. There's no "merge but keep separate" option; if independence is wanted, the merge itself has to be skipped.
2. **"Accept incoming" is a per-conflict choice, not a whole-file or whole-branch one.** For each spot where both branches touched the same lines differently, incoming = dev's version, current/ours = this branch's version. Picking incoming for one conflicting hunk doesn't affect unrelated hunks elsewhere in the same file.

The actual bug came from that second point. Checking the merge commit directly (`git show <merge-commit> -- path/to/file`) showed dev had independently fixed the same `bootGame`-identity problem, but with a different, also-valid approach: wrapping `bootGame` in `useCallback(..., [difficulty])` and depending on `[bootGame]`. This branch had a different valid approach: a plain `bootGame` depending on `[difficulty]` directly. The import line, the `useCallback` wrapping, and the effect's dependency array are three separate, non-adjacent regions of the file — git treated them as independent, non-conflicting hunks and combined them without ever flagging a conflict: it kept *this branch's* plain, unmemoized `bootGame` body (good — that's the version with all the session's feature work), but took *dev's* `useCallback` import and `[bootGame]` dependency line. Those two halves don't work together — an unmemoized function depended on as `[bootGame]` re-creates the game engine on every render, which is exactly what caused the "snaps back to start" symptom.

### Why this matters
A merge can complete with **zero conflict markers** and still be semantically broken, if two branches solved the same problem differently in ways that touch non-overlapping lines. Git only flags a conflict when both sides changed the *exact same* lines — it has no concept of "these three separate edits only make sense together." After merging a branch that touched the same feature/file you were working on, it's worth deliberately re-reading the result (not just checking it builds), especially anywhere both branches were likely to have solved the same problem independently. And since this merge was already pushed through a PR to a shared branch, the right move was to fix forward with a new commit — not rewrite already-shared history.

---

## A merge is additive, not destructive — and "no conflicts" only means "no textual overlap"

### Question
Merging `main` into `dev` (to resolve a PR that said "can't automatically merge") re-introduced the exact `[bootGame]`/unmemoized-function bug from before — on a line that never showed up as a conflict at all, in either GitHub's PR UI or VSCode's merge editor. What actually happened, and what does merging really do to a branch?

### Answer
Two ideas, both worth being precise about:

**A merge doesn't overwrite a branch — it adds to it.** `git merge <other>` while on `dev` creates one *new* commit with two parents (the old `dev` tip and `<other>`'s tip). Every commit `dev` already had is still there, still reachable, still intact — nothing is deleted or replaced. What's new is just the merge commit itself, which records how the two histories got reconciled. "Accept Current" vs "Accept Incoming" only decides what the content becomes *going forward from that commit* for the specific lines that conflicted — it's not erasing anyone's branch, and the losing side's content is still recoverable from history (`git show <commit>:path`) if ever needed.

**"No conflicts" is a purely textual guarantee, not a correctness one.** Git flags a conflict only when both sides changed the *exact same lines*. It has no concept of two changes being logically coupled while living in different parts of a file — like "is this function memoized" (one spot) and "what does the effect depending on it list as a dependency" (a different spot, potentially dozens of lines away). When only one side is seen as having "really" changed a given line (relative to whatever git computes as the common ancestor), that line gets silently auto-merged with **zero prompt, zero warning, and zero visibility in the PR UI** — not even a "these lines were auto-merged, please double check" notice. This is a level up from the earlier merge bug in this log: that one was a *manual* mis-resolution across separate hunks; this one was git resolving something *automatically* and silently, with no chance to even notice it happening in the diff view.

### Why this matters
"No conflicts" (from git, GitHub, or any merge tool) means exactly one thing: no two sides touched the identical lines. It says nothing about whether the combined result actually behaves correctly, especially for code where meaning depends on two pieces staying in sync but sitting apart in the file. The only real safety net is testing the actual resolved code before committing — which is exactly why building and running the app locally, right after resolving conflicts and before running `git commit`, caught this one when nothing else would have.

---

*From here on, entries are also grouped under a category heading — the deployment work pulled in enough DNS/hosting/git-collaboration concepts to deserve their own section instead of one long flat list.*

---

# Category: Deployment & DNS

## CNAME vs. A record, and why the domain apex is special

### Question
What's the difference between a CNAME and an A record, and why couldn't the frontend just get a plain CNAME the same way `api.altus.games` did?

### Answer
An **A record** points a name straight at an IP address. A **CNAME** points a name at *another name*, which DNS then resolves further — used when the target's IP can change over time (true of almost all AWS/Vercel/CloudFront-style hosting, where you get a hostname, not a stable IP). `api.altus.games` → Heroku works as a plain CNAME because it's a subdomain.

The catch is the **zone apex** (bare `altus.games`, no subdomain): a CNAME isn't allowed to coexist with the other record types (MX, TXT, etc.) a domain root needs, so DNS rules forbid a real CNAME there. That's why apex-domain hosting on AWS/Vercel usually means one of: an ALIAS/ANAME record (a non-standard extension some registrars/Route 53 support that behaves like a CNAME but is legal at the apex), or plain domain forwarding the bare domain to `www`, and putting the real CNAME on `www` instead.

### Why this matters
Subdomains (`www.altus.games`, `api.altus.games`) are simple, ordinary CNAMEs. The bare apex is the special case — check whether your registrar supports ALIAS/ANAME before assuming a CNAME will just work there too.

---

## DNS routing to a host vs. which project on that host actually serves you

### Question
Why didn't `altus.games` need any DNS changes on Names.com when the live app moved from a teammate's Vercel project to a personal fork's Vercel project?

### Answer
Two separate layers. **DNS** only has to say "route this hostname to Vercel's network in general" — an A record to Vercel's shared IP, or a CNAME to `cname.vercel-dns.com`. That's generic infrastructure, not tied to any one project, and it can be set up once and never touched again. **Which specific project** actually renders the page for that hostname is decided entirely inside Vercel's own dashboard, under each project's Domains settings — and a domain can only be actively claimed by one project at a time (even across different Vercel accounts). Adding the domain to a new project there re-points the claim, with zero DNS changes required, as long as the DNS was already correctly aimed at Vercel from some earlier setup.

### Why this matters
"It just started working without touching DNS" isn't magic — it means the DNS layer was already correct from an earlier deploy attempt, and only the project-level domain claim changed. It's also a real risk to flag to a teammate: claiming a domain in your own project can silently un-claim it from theirs.

---

## Vite's `base` option: subpath hosting vs. root-domain hosting

### Question
What does `base` in `vite.config.ts` actually do, and why did setting `base: "Altus-frontend"` break the production deploy?

### Answer
`base` tells the build "every asset URL (JS, CSS, favicon, etc.) should be prefixed with this path" — because the app will be served from a subfolder, not the domain root. That's the right setting for hosts like GitHub Pages, where a project site really does live at `username.github.io/repo-name/`. Vercel serves the app at the domain root (`/`), so setting `base` to anything other than `/` (the default) makes every asset reference resolve to a path that doesn't exist there — e.g. `/Altus-frontend/assets/index-xxx.js` 404s when the real file is at `/assets/index-xxx.js`.

Confirmed directly by rebuilding locally with and without the line and diffing the generated `dist/index.html` — with it present, every `src`/`href` in the file, including the favicon link, got the `/Altus-frontend/` prefix added.

### Why this matters
The build **succeeds** either way — Vite only prints a warning (`"base" option should start with a slash`), never an error — so "the deploy succeeded" only means the build pipeline finished, not that the page actually renders. Those are different claims, and conflating them is exactly how this shipped unnoticed.

---

## Diagnosing a blank white production page without guessing

### Question
Build settings (framework preset, output directory, root directory) were all confirmed correct on Vercel and the page was still blank. What's the actual next step, instead of guessing at more settings?

### Answer
Two moves, in order: **(1)** check DevTools Console/Network on the live page for the actual error — a blank `#root` with nothing rendered is almost always an uncaught JS exception or a 404 on the script itself, and the message there points straight at the cause instead of another guess. **(2)** Reproduce the exact production artifact locally: `npm run build && npm run preview` (Vite's own preview server, correctly rooted at `dist/`) — not by opening `dist/index.html` directly in something like a "Live Server" editor extension. That extension serves files relative to the *workspace* root, not the `dist` folder, so a perfectly correct build's absolute asset paths (`/assets/...`) resolve to the wrong location and 404 — a false "it's broken" signal that has nothing to do with the actual app.

### Why this matters
Two different bugs can produce the identical symptom (blank white page, empty `#root`, favicon still visible). The only way to tell them apart is real evidence — a Console error, or a correctly-served local reproduction — not pattern-matching to whatever the last fix happened to be.

---

## A single-page app needs a server-level rewrite for client-side routes

### Question
Every route worked fine when navigated to by clicking a link, but refreshing on `/login` (or any route besides `/`) showed a 404. Why?

### Answer
Clicking a link inside the app is intercepted by React Router client-side — no real network request happens, so it always looks fine. A hard refresh (or typing the URL directly, or a bookmark) sends a real HTTP request to the host for that exact path. A static host has no file at `/login` — only one `index.html` exists, and only React Router (running inside the already-loaded JS) knows `/login` is a valid route. The fix is a host-level rewrite telling the server "serve `index.html` for every path, no matter what," e.g. in `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Why this matters
This isn't specific to this bug or to Vercel — any client-side-routed SPA (React Router, etc.) needs an equivalent fallback rule on any static host (Netlify, S3+CloudFront, etc.), or every route but the homepage will 404 on refresh.

---

## Vercel forking a repo you don't have admin rights on

### Question
Why did a duplicate copy of the team repo suddenly appear on a personal GitHub account after connecting it to Vercel?

### Answer
Vercel's GitHub integration needs permission to install a deploy webhook on the repo it's building from. When the account connecting it only has Contributor-level access (not Admin) on the real repo, Vercel can't get that permission there — so it falls back to forking the repo into that user's own account, where it *does* have full control, and deploys from the fork instead.

### Why this matters
The fork is a fully independent copy from that point on — changes pushed there don't touch the real team repo, and vice versa. Confusing at first, but genuinely useful as an isolated, zero-risk place to test a fix (like the `base` path bug) before asking someone with real write access to apply it to the shared repo.

---

# Category: Git & Collaboration

## Using git history as evidence, not assumption, to resolve a contradiction

### Question
A teammate said she'd deployed successfully with "the same `vite.config.ts`" that had just been diagnosed as broken. How do you resolve that without just guessing who's right?

### Answer
`git log -- <file>`, `git blame -L <range> -- <file>`, and `git diff HEAD -- <file>` gave an exact author and timestamp for the change in question — which showed the breaking line had been committed to `main` only hours earlier, the same day. That either confirms or reframes a claim like "the same file" instead of leaving it as two people's word against each other.

### Why this matters
Same instinct as reading the actual code instead of trusting a summary of it: when a bug report and a "but it worked for me" claim seem to conflict, check the real git history before assuming either side is mistaken.

---

## `git revert` vs. `git reset --hard` for undoing a commit on a shared branch

### Question
How do you undo a commit that's already on a branch other people share (and that you may not even own)?

### Answer
`git revert <commit>` adds a brand-new commit that cancels out the original change. History stays fully intact — the original commit is still there, just followed by one that undoes it — so it's safe on shared/protected branches and doesn't break anyone who already pulled the original commit. `git reset --hard` followed by a force-push actually erases the commit from history, rewriting what everyone else sees; it breaks their local copy the next time they pull, and protected branches usually block force-pushes outright anyway.

### Why this matters
Default to `revert` on any branch other people share. Reserve `reset --hard` for your own local, not-yet-pushed mistakes.

---

## Empty commits as harmless CI/CD triggers

### Question
Does a `git commit --allow-empty` made just to trigger a Vercel preview build need to be cleaned up afterward?

### Answer
No. It has zero file changes, so there's nothing to actually revert — reverting an empty commit just adds another empty commit, achieving nothing. Trying to erase it from history entirely would mean a `reset --hard` + force-push, which risks breaking a shared branch for anyone who's already pulled it, for a purely cosmetic benefit.

### Why this matters
Not every commit needs to carry a "real" change — a deliberate no-op commit to trigger automation (a build, a webhook) is a normal, harmless pattern, safe to leave in history as-is.

---

## The five-layer pattern for wiring any API into a page

### Question
"Integrate the API" always feels like one big vague task — what's the actual repeatable shape of it, so it stops feeling that way?

### Answer
Every endpoint this app wires up passes through the same five layers, always in this order:

1. **API function** (`src/api/*.tsx`) — talks to the backend, nothing else. Just `fetch`, the auth header, error handling. No React.
2. **Context** (`src/context/*Context.tsx`) — owns the shared state: the data, `isLoading`, `error`, and a `refresh*()` function. Calls the layer-1 function; never calls `fetch` itself. This is the one copy of the data every page reuses instead of refetching.
3. **Hook** (`src/context/use*.tsx`) — the thin `useContext` wrapper pages actually import. Throws a clear error if the provider isn't mounted, instead of a silent `undefined` three components deep.
4. **Wiring** (`main.tsx`) — the provider has to actually wrap the app, or layers 1-3 do nothing. **This is the step that's easiest to forget** — writing the context and hook but never mounting the provider is the most common cause of "why is this undefined." Order matters too: anything reading the token has to sit *inside* `AuthProvider`.
5. **Page** — reads from the hook only, renders loading/error/data states, calls `refresh*()` when it needs fresh data. Never calls the API function or `fetch` directly.

Four things every context needs to actually hold up over time: `isLoading` + `error` state (not just the data), a named `refresh*()` exposed to consumers, a clear-on-logout path, and exactly one fetch trigger on mount/login so two components can't double-fetch.

The "when," separately from the "what": a context can be told to refresh at more than one moment — e.g. `ProfileContext` refreshes once on login, and again after every completed game, so Profile never shows stale data on the next visit.

Full diagram (file-by-file, with the login → refresh and post-game → refresh timelines): see the "API Integration Flow" artifact from the 2026-07-12 session.

### Why this matters
This is the same five-layer shape for any new endpoint, not just this one — `ExercisesContext` already follows it, and `ProfileContext` (Step 6, combining `achievements.ts` + `workoutSessions.tsx` into one context) is the next one built on it. Once the shape is recognized, a new integration becomes five small checkable steps instead of one big unclear one.

---
