# MediaPipe From Scratch: How a Squat Becomes a Dino Jump

This is a beginner-level walkthrough of MediaPipe, written as if none of it existed
in the project yet. Read this **before** opening the real code
(`src/mediapipe/*.tsx`) — once the concepts below make sense, the actual
implementation is just "the same 5 steps, with real thresholds."

We'll use one concrete example the whole way through:

> 🏃 Player squats in front of the webcam → 🦖 the Dino in the game jumps.

---

## 1. What actually *is* MediaPipe?

Think of MediaPipe as a **pre-trained skeleton-tracking service that runs
entirely in the browser.**

You do **not**:
- train a model
- know anything about neural networks
- send video anywhere over the network

You **do**:
- hand it one video frame
- get back a list of body coordinates ("landmarks") — shoulders, wrists, hips, knees, etc.

```
📷 one video frame  ──▶  🧠 MediaPipe Pose model  ──▶  📍 33 (x, y, z, confidence) points
```

That's the entire contract. Everything else in this doc — "is that a squat?",
"did they raise their right arm?" — is **code we write ourselves**, looking at
those 33 points. MediaPipe never knows what a squat is. It only ever hands you dots.

---

## 2. The big picture (squat → jump), before any code

```
 ┌───────────┐     ┌────────────────┐     ┌───────────────┐     ┌────────────────┐
 │ 📷 Camera │ ──▶ │ 🧠 Pose Model   │ ──▶ │ 🕵️ Squat Logic │ ──▶ │ 🦖 Dino Game    │
 │  raw video │     │ gives landmarks │     │ "was that a    │     │  reacts: jump!  │
 │            │     │  33 body points │     │  squat? yes/no"│     │                │
 └───────────┘     └────────────────┘     └───────────────┘     └────────────────┘
```

Four boxes, four jobs:

| Box | Job | Knows about squats? | Knows about the game? |
|---|---|---|---|
| 📷 Camera | capture raw pixels | ❌ | ❌ |
| 🧠 Pose Model | pixels → 33 landmark points | ❌ | ❌ |
| 🕵️ Squat Logic | landmarks → "squat happened" | ✅ | ❌ |
| 🦖 Game | reacts to "squat happened" | ❌ | ✅ |

Nobody in this chain knows more than they need to. That separation is the whole
trick — keep it in mind, we'll come back to it in step 5.

---

## 3. Building it from an empty project, step by step

### Step 1 — Install the package 📦

```bash
npm install @mediapipe/tasks-vision
```

This gives you the pose-tracking model and the JS/WASM code that runs it —
nothing project-specific yet.

### Step 2 — Get a live video feed 🎥

Before MediaPipe can do anything, you need frames to feed it. In the browser
that means asking for camera permission and attaching the stream to a
`<video>` element:

```ts
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
videoEl.srcObject = stream;
```

At this point you have a live camera feed on the page and **zero** AI involved yet.

### Step 3 — Load the Pose model 🧠

```ts
const vision = await FilesetResolver.forVisionTasks(/* wasm files */);
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetPath: /* the .task model file */ },
  runningMode: "VIDEO",
});
```

This downloads/loads the pre-trained model once. Think of it like loading a
big lookup table into memory — slow-ish the first time, then ready to use
repeatedly.

### Step 4 — Ask it to detect, every frame, in a loop 🔁

Video is just ~30-60 still images per second. So you loop, and on every frame
ask the model "what do you see right now?":

```ts
function loop() {
  const now = performance.now();
  const result = poseLandmarker.detectForVideo(videoEl, now);
  // result.landmarks[0] = 33 points for the one detected person
  requestAnimationFrame(loop); // do it again next frame
}
```

`requestAnimationFrame` just means "run this again right before the next
screen repaint" — the browser's standard way to do smooth, continuous work.

At this point: **you have a live stream of skeleton points, forever, doing
nothing with them yet.**

### Step 5 — Broadcast the raw points, don't hand them out directly 📡

This is the one non-obvious design decision. Instead of the camera/model code
directly calling "squat detector code" and "game code" itself, it just shouts
the data into the page:

```ts
window.dispatchEvent(new CustomEvent("pose-detected", { detail: result.landmarks[0] }));
```

```
 🧠 Model loop
     │
     │  "here's this frame's landmarks, I don't care who's listening"
     ▼
 📡 window (CustomEvent)
     │
     ├──▶ 🕵️ Squat Logic  (listening for "pose-detected")
     └──▶ 🙋 Arm-gesture Logic  (listening for "pose-detected", totally independent)
```

**Why bother?** Because now the camera/model code never needs to know squats
or arm-raises or Dino games exist. You could add a third listener next month
(a push-up detector, say) without touching this file at all. This is the same
idea as an event bus / pub-sub — one broadcaster, any number of independent
listeners.

### Step 6 — Turn "points" into "a squat happened" 🕵️

This is where domain logic finally shows up — MediaPipe never had an opinion
here. A squat, roughly: **the hip point moves down, then back up, past some
threshold, within some amount of time.**

```
        standing               squatting               standing again
     hip.y ≈ 0.55           hip.y ≈ 0.75 (lower!)        hip.y ≈ 0.55
        🧍                        🧎                          🧍
         │                         │                            │
         └────────── down ────────┴─────────── up ──────────────┘
                                     ▲
                         if this dip is big enough → "squat!"
```

(Remember: MediaPipe's `y` grows *downward*, so "lower on screen" = *bigger* y.)

In code, that's just watching one number over time:

```ts
window.addEventListener("pose-detected", (e) => {
  const hipY = e.detail[HIP_INDEX].y;
  // compare hipY against a remembered "standing" baseline
  // if it dipped past a threshold and came back up → dispatch a squat event
});
```

### Step 7 — Announce the *meaningful* event, not the raw one 📣

Same broadcasting trick as step 5, but now with a name that means something:

```ts
window.dispatchEvent(new CustomEvent("squat-detected"));
```

Now anything in the app — a rep counter, the game, a debug logger — can listen
for `"squat-detected"` and never has to know what a "hip landmark" even is.

### Step 8 — The game reacts, without knowing MediaPipe exists 🦖

```ts
window.addEventListener("squat-detected", () => {
  dino.jump();
});
```

That's it. The game engine's code doesn't import MediaPipe, doesn't know
about cameras, doesn't know about landmarks. It just knows "when this named
event fires, jump" — the exact same handler shape it would use for a
keyboard press.

---

## 4. Full loop, now that all 8 steps exist

```
📷 Camera            🧠 Pose Model         📡 "pose-detected"        🕵️ Squat Logic        📣 "squat-detected"       🦖 Game
   │ frame               │ 33 points            │ broadcast              │ watch hip.y            │ broadcast               │
   └──────────────────▶  └──────────────────▶   └──────────────────▶     └──────────────────▶      └──────────────────▶      jump()
        (30-60x / sec, forever, via requestAnimationFrame)
```

Two "broadcast" hops, on purpose — one raw (`pose-detected`), one meaningful
(`squat-detected`) — so every stage only ever knows the one thing it's
responsible for.

---

## 5. One gotcha worth knowing up front: false triggers

A single noisy/jittery frame could momentarily look like a squat even when
the player is just shifting weight. Real implementations guard against this
with two extra ideas layered on top of step 6-7:

- **Hold it for a few frames in a row**, not just one, before believing it.
- **Cooldown** — after firing once, ignore new detections for a short window,
  so one squat can't accidentally fire twice.

You'll see both of these as small constants (frame counts / millisecond
timers) once we look at the real detector code — they're not new concepts,
just "step 6, made less twitchy."

---

## 6. Where this maps in the real project (for later)

Once the concepts above feel solid, here's the same 8 steps mapped to real
files — useful as a reference, not something to read line-by-line yet:

| Step | Real file |
|---|---|
| 2-4: camera + model + loop | `src/mediapipe/mediapipePlayer.tsx` |
| 5: raw landmark broadcast | `src/mediapipe/mediapipePlayer.tsx` → `"mv:pose"` event |
| 6-7: squat interpretation + meaningful event | `src/mediapipe/squatDetector.tsx` → `"mv:squat:start"` |
| 6-7: arm-raise interpretation (confirm/cancel) | `src/mediapipe/armGestureDetector.tsx` → `"mv:confirm"` / `"mv:cancel"` |
| 8: game reacting | `src/engine/DinoRunGameEngine.ts` |

See [docs/lesson-log.md § "MediaPipe and the game are decoupled through
events, not imports"](./lesson-log.md) for the deeper dive once you're ready
for real code.
