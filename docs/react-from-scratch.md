# React From Scratch: Mounting, Module Scope, and Why the Camera Lives Outside React

This is a beginner-level walkthrough of a few React concepts that came up
while reading `useMediaPipe.tsx` and `mediapipePlayer.tsx`: what "mounting"
and "unmounting" actually mean, what "module scope" is and why it's *not*
React, and how `useState` and `useRef` differ. Read this once, then
`docs/mediapipe-from-scratch.md` §3 and §9 should click into place.

---

## 1. What React actually controls

A React app is still just a webpage made of HTML, CSS, and JavaScript —
nothing about the browser changed. What React adds is a **manager** that
decides two things for you:

- **When** should this piece of UI's code run again?
- **What** should the real DOM look like, given that code's latest output?

```
   plain JS/HTML page                    React page
 ┌───────────────────────┐        ┌───────────────────────────┐
 │ you write code that    │        │ you write a function that  │
 │ directly touches the   │        │ returns JSX ("what the UI  │
 │ DOM: document.query    │        │ should look like right     │
 │ Selector, .innerHTML=  │        │ now") — React decides when │
 │ ...                    │        │ to call it and updates the │
 │                        │        │ real DOM to match           │
 └───────────────────────┘        └───────────────────────────┘
   you control the "when"           React controls the "when"
```

Crucially: React only manages the things you explicitly hand it —
`useState`, `useRef`, `useEffect`, and the JSX a component returns. Any
plain JavaScript sitting in the same file that *isn't* one of those — a
plain variable, a plain function — behaves exactly like it would in a file
with no framework at all. That distinction is the whole point of this doc.

---

## 2. Mounting and unmounting, concretely

**Mounting** = React runs your component function for the first time,
creates real DOM nodes from what it returned, and inserts them into the
page.

**Unmounting** = React removes those DOM nodes from the page and throws the
entire component instance away — every `useState` value, every `useRef`
value, gone. If you navigate back to that route later, it's not "the same
instance resuming" — it's a completely fresh mount, starting from scratch.

Concretely, in this app: clicking away from `/exercise` back to `/`
**unmounts** `ExercisePage`. React is happy to do this instantly and
silently — from React's point of view, a component disappearing is a normal,
clean event. `useEffect`'s cleanup function (the part after
`return () => { ... }`) is React's way of tapping you on the shoulder right
before that happens: *"I'm about to throw this away — if you started
anything that lives outside of me, now's your chance to stop it."*

```
mount ─────────────────────────────────────────▶ unmount
  │                                                  │
  │  useState/useRef values exist,                   │  React discards the
  │  effects have run                                │  component instance;
  │                                                   │  cleanup functions run
  │                                                   │  right before this
```

That's the exact moment `useMediaPipe.tsx`'s cleanup function fires — see
`docs/mediapipe-from-scratch.md` §8, Step 9.

---

## 3. Module scope: a fourth kind of memory

Every `.tsx`/`.ts` file is **loaded once** by the bundler/browser, the first
time something imports it. Any code sitting directly in that file — *not*
inside a function — runs exactly once, at that moment, and any variables
declared there keep living for as long as the module stays loaded (in
practice: the entire time the page is open, unless the whole page reloads).

This is called **module scope**, and it has nothing to do with React at
all — it's plain JavaScript, the same as it would be with no framework:

```ts
// mediapipePlayer.tsx — this line runs ONCE, when the file is first imported
let currentStream: MediaStream | null = null;
```

That single variable is **shared** by every function in that file, and it
does not belong to any particular component instance. It doesn't get reset
when `ExercisePage` mounts, and it doesn't get cleared when `ExercisePage`
unmounts — React has no idea it exists, because it was never created
through `useState` or `useRef`.

Here's the full picture, from shortest-lived to longest-lived:

| Kind of memory | Created | Reset when | Who can see it |
|---|---|---|---|
| Plain local variable inside a component function | every render | every re-render | that render only |
| `useRef` value | on mount | never, until unmount | that component instance, across all its re-renders |
| `useState` value | on mount | never, until unmount (and changing it triggers a re-render) | that component instance, across all its re-renders |
| **Module-scope variable** | once, when the file is first imported | **never** — not even on unmount | **any function in that file**, regardless of which component (if any) is currently mounted |

That last row is the answer to *"isn't this a React app, shouldn't
everything be under React?"* — no. Only the four hooks React gives you
(`useState`, `useRef`, `useEffect`, etc.) are actually managed by React.
Plain module-level variables are just... JavaScript, sitting there,
unrelated to whatever component happens to be on screen.

---

## 4. Why the camera specifically uses module scope

**One correction/refinement worth making explicit:** calling
`initMediaPipe()`/`stopMediaPipe()` *from inside* `useMediaPipe.tsx`'s
`useEffect` does mean React controls **when** they run (mount, unmount) —
that part genuinely is React. What React does *not* control is **where the
value they touch lives, or how long it survives**. Those are two separate
questions:

| | Controlled by React? |
|---|---|
| **Timing** — when does this code run | Yes — via `useEffect`, that's real React |
| **Memory** — where does the value live, how long does it survive | No, unless it was created with `useState`/`useRef` |

`currentStream` is a plain `let`, so its *storage* is just JavaScript.
React has no reference to it, doesn't know it exists, doesn't reset it on
unmount — even though the *function that assigns it* was called by React.

**Is module scope strictly required, then?** Not by a hard rule — it's true
that `initMediaPipe()`/`stopMediaPipe()` themselves cannot call `useRef()`
directly, since *creating* a ref is only legal inside a component or hook,
and these are plain functions. But a ref could still have been threaded
through: `useMediaPipe.tsx` (which *is* a hook) could create
`const streamRef = useRef<MediaStream | null>(null)` and pass that ref
object **as a parameter** into `initMediaPipe(streamRef)` — reading/writing
`.current` on an already-created ref doesn't require being inside a hook,
only *creating* it does.

So why wasn't it built that way? A `useRef` is tied to **one specific
mounted component instance** — if `useMediaPipe` were ever used twice at
once, each call would get its own separate ref, its own separate camera.
This app only ever wants **one** camera/model active for the whole page,
reachable by files that don't even know about each other
(`squatDetector.tsx` and `armGestureDetector.tsx` both need the same pose
model without either one owning it). Module scope is simply the simpler
tool for "one shared instance, anyone in this file can reach it" — the
alternative would mean threading a ref parameter through every function in
every file that touches it, for a multi-instance flexibility this app
doesn't actually need.

With that framing, here's what the module-scope variable is actually doing:

```
 initMediaPipe()                          stopMediaPipe()
      │                                          │
      │  currentStream = stream                  │  currentStream?.getTracks()
      │         │                                │        .forEach(t => t.stop())
      ▼         ▼                                ▼
  ┌──────────────────────────────────────────────────┐
  │   let currentStream  (module scope, one copy)      │
  └──────────────────────────────────────────────────┘
```

`useMediaPipe.tsx` is the bridge: it's a proper React hook, so it *can* use
`useEffect`, and its cleanup function is what calls `stopMediaPipe()` at the
right React-lifecycle moment (unmount). The camera resource itself still
lives outside React the whole time — `useMediaPipe` just knows *when* to
tell it to stop.

---

## 5. `useState` vs `useRef`

Both survive across re-renders of the *same* mounted component instance —
that's what they have in common. The difference is what happens when you
change the value:

| | `useState` | `useRef` |
|---|---|---|
| Changing it triggers a re-render? | **Yes** — that's the whole point | **No** — React never notices |
| Survives re-renders? | Yes | Yes |
| Survives unmount? | No — fresh mount, fresh value | No — fresh mount, fresh value |
| Good for | anything the UI needs to visually reflect | remembering a value between renders that the UI doesn't need to redraw for |

Real example from this repo, `Exercise.tsx`:

```ts
const [isCameraOpen, setIsCameraOpen] = useState(false); // useState
const streamRef = useRef<MediaStream | null>(null);      // useRef
```

`isCameraOpen` is `useState` because setting it needs to change what's on
screen — swap the "Open Camera" button for the live `<canvas>`. That's
exactly what `useState` is for: *"when this changes, re-render."*

`streamRef` is `useRef`, deliberately not `useState`, because storing the
`MediaStream` object doesn't need to trigger anything visually — the video
element already plays the live feed the moment `srcObject` is set, with no
help from React re-rendering. All `streamRef` needs to do is **remember**
the stream so the cleanup effect can find it later and call
`.getTracks().forEach(track => track.stop())`. Using `useState` here would
technically still work, but would trigger a pointless extra re-render every
time the ref is set, for zero benefit.

---

## 6. Putting all three lifetimes together

```
 page session (module scope)
 ├─ currentStream, currentPoseLandmarker, rafId   ← survive every mount/unmount
 │
 ├─ mount: ExercisePage
 │   ├─ useState: isCameraOpen, isCalibrated, ...  ← reset if this unmounts
 │   ├─ useRef:   streamRef, videoRef, ...          ← reset if this unmounts
 │   │
 │   ├─ render 1 → render 2 → render 3 ...
 │   │     each render: plain local variables inside the function body
 │   │     are recreated from scratch every single time
 │   │
 │   └─ unmount → cleanup effects run → stopMediaPipe() reaches into
 │                module scope and clears it, even though module scope
 │                itself doesn't belong to this component at all
```

The camera bug from `docs/mediapipe-from-scratch.md` §9 was, in one
sentence: something living in the **outermost** ring (module scope) had no
wire connecting it to the **middle** ring's (component mount) cleanup
event — so when the middle ring ended, the outer ring never heard about it.

---

## 7. Where to look next

| Concept | Real file |
|---|---|
| Module-scope camera/model state | `src/mediapipe/mediapipePlayer.tsx` — top of file |
| The hook bridging React's unmount to `stopMediaPipe()` | `src/mediapipe/useMediaPipe.tsx` |
| `useRef` example (no re-render needed) | `src/pages/Exercise/Exercise.tsx` — `streamRef` |
| `useState` example (re-render needed) | `src/pages/Exercise/Exercise.tsx` — `isCameraOpen` |

See `docs/lesson-log.md` § "React Hooks & Rendering" for more Q&A-style
notes on hooks as they've come up elsewhere in this project.
