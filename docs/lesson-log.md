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
