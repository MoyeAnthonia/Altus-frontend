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
