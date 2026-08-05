# Google OAuth From Scratch: How a Tap on "Sign in with Google" Becomes an Altus Session

This is a beginner-level walkthrough of the Google Sign-In integration, written
as if none of it existed in the project yet. Read this **before** opening the
real code (`src/pages/Login/Login.tsx`, `src/api/auth.tsx`) — once the
concepts below make sense, the actual implementation is just "the same steps,
with real error handling."

We'll use one concrete flow the whole way through:

> 🧑 Player taps "Sign in with Google" → 🎮 they land inside Altus, logged in.

---

## 1. What Google Sign-In actually gives you

The biggest beginner misconception: thinking our frontend somehow "checks the
user's Google password." **It never does, and never can.** The password never
leaves Google's own UI.

Think of Google Sign-In as a **notarized ID card**, not a password hand-off:

```
🧑 User picks their Google account
        │
        │  (this part happens entirely inside Google's own popup/UI —
        │   our code never sees the email or password being typed)
        ▼
🔷 Google verifies them, the usual way it always does
        │
        ▼
📄 Google hands OUR PAGE back one thing: a signed token that says
   "I, Google, verify this person's email is really x@gmail.com"
```

That signed token is called an **ID token** (a JWT — a block of text Google
cryptographically signs). Everything else in this doc — "how do we turn that
into a logged-in Altus user?" — is code **we** write. Google never knows
Altus exists. It only ever hands back one notarized fact: *this email is
really this person*.

---

## 2. The big picture: three parties, not two

A normal email/password login is a conversation between **two** parties:

```
🧑 Browser  ◀──────────────▶  🖥️ Our Backend
```

Google Sign-In adds a **third** party in the middle. The browser talks to
Google first, gets a token, then relays that token to *our* backend — a
password never travels over the wire to us at all:

```
 ┌──────────┐  1. click "Sign in with Google"   ┌───────────────┐
 │ 🧑 Browser│ ─────────────────────────────────▶│ 🔷 Google      │
 │  (Altus) │ ◀───────────────────────────────── │  Identity      │
 └──────────┘  2. signed ID token (a JWT)        │  Services      │
       │                                         └───────────────┘
       │ 3. POST /auth/google { id_token }
       ▼
 ┌───────────────┐  4. verify signature, resolve user  ┌────────────┐
 │ 🖥️ Our Backend │ ────────────────────────────────────▶│ 🗄️ Database │
 └───────────────┘ ◀──────────────────────────────────── └────────────┘
       │
       │ 5. { token: <OUR OWN JWT>, user }
       ▼
 ┌──────────┐
 │ 🧑 Browser│  stores OUR token — exactly like a normal
 └──────────┘  email/password login would
```

Step 5 is the important one to notice: **by the time our backend responds,
Google is completely out of the picture.** The browser ends up holding the
exact same shape of thing (`{ token, user }`) it would get from
`POST /auth/login`. That's not a coincidence — it's the whole design.

---

## 3. The one rule that trips people up: two different tokens

There are **two completely different tokens** in this flow, and confusing
them is the #1 beginner bug:

| | Google's ID token | Our own JWT |
|---|---|---|
| Who issues it | Google | Our backend |
| What it proves | "this email is really this person," to *us*, once | "this browser is logged into Altus as user X" |
| How long it matters | A few seconds — only long enough to reach step 3 above | Every request, until logout/expiry |
| Where you send it | Once, in the body of `POST /auth/google` | On every protected request, as `Authorization: Bearer <token>` |

Once step 4 finishes, Google's ID token is **thrown away**. Nothing about it
is stored. From that point on, Altus runs entirely on its own JWT — same as
if the user had typed a password. If you ever catch yourself trying to send
Google's token to some *other* Altus endpoint later, that's the sign
something's confused — only `/auth/google` ever wants it.

---

## 4. Building it, step by step

### Step 1 — Install the library 📦

```bash
npm install @react-oauth/google
```

A thin React wrapper around Google's own Identity Services script — gives you
a `<GoogleLogin>` component instead of hand-rolling `<script>` tags.

### Step 2 — Get a Client ID, and treat it as public 🆔

In Google Cloud Console you register the app and get a **Client ID** — a long
string ending in `.apps.googleusercontent.com`. It goes straight into `.env`:

```
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

This is **not a secret** — it identifies *which app* is asking, not a key
that authenticates anything. That's why it's safe as a `VITE_`-prefixed
(browser-visible) env var. The real verification work happens **backend
side**, checking the ID token's signature against Google's public keys.

One consequence worth knowing: Google Cloud Console also has a list of
**Authorized JavaScript origins** — every domain the button is allowed to run
from (`http://localhost:5173` in dev, your real domain in prod). Forget to
add a domain there, and the button silently refuses to work on it.

### Step 3 — Make the Client ID available everywhere 🌳

```tsx
// src/main.tsx
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <AuthProvider>
    <App />
  </AuthProvider>
</GoogleOAuthProvider>
```

This has to wrap the app **above** anywhere the button renders — same reason
`AuthProvider` does. A `<GoogleLogin>` button buried three components deep
still needs to reach up and find this provider.

### Step 4 — Teach the API layer the new shape 📡

Every existing auth call (`loginUser`, `registerUser`) follows the same
pattern: `fetch`, check `response.ok`, throw `error.error` on failure,
otherwise return the JSON. The Google version is no different — same shape,
just a different body and endpoint:

```ts
// src/api/auth.tsx
async function googleAuth(id_token: string) {
  const response = await fetch(`${BASE_URL}/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Google sign-in failed");
  }
  return response.json();
}
```

### Step 5 — Render the button, catch what Google hands back 🖱️

```tsx
<GoogleLogin
  onSuccess={async (credentialResponse) => {
    const idToken = credentialResponse.credential; // this IS the ID token from § 1
    const result = await googleAuth(idToken);
    login(result.token, result.user); // same AuthContext call password login uses
    navigate("/");
  }}
/>
```

`credentialResponse.credential` is the library's name for the exact thing
described in § 1 — Google's signed ID token. Everything after that line is
**identical** to what `onLoginSubmit` already does. That's the payoff of
designing the backend response to match: the frontend never needs an
`if (loggedInViaGoogle)` branch anywhere.

```
        Google button                Email/password form
              │                              │
   credentialResponse.credential      email + password
              │                              │
              ▼                              ▼
        googleAuth(id_token)            loginUser(email, pw)
              │                              │
              └──────────────┬───────────────┘
                              ▼
                  { token, user }  (same shape either way)
                              │
                              ▼
                 login(result.token, result.user)
                              │
                              ▼
                        navigate("/")
```

---

## 5. Why the backend can safely always return `200`

`POST /auth/google` resolves the signed-in user one of three ways, in order:

1. **Already linked** — `google_id` on some row already matches → log in, no write.
2. **Same email, first Google sign-in** — an existing password account shares
   this (Google-verified) email → auto-linked, then logged in.
3. **New player** — no match either way → a brand-new account is created,
   with `password_hash` left `null`.

From the browser's point of view, **all three look exactly the same**: a
`200` with `{ token, user }`. There's no "was this actually a signup?"
signal to handle, because there's nothing meaningfully different to do in any
of the three cases — you're logged in either way. That's *why* step 5's code
above never has to branch.

---

## 6. Gotchas worth knowing up front

- **`id_token` ≠ `access_token`.** An access token would let an app act *on
  the user's behalf* against Google's own APIs (read their calendar, etc.) —
  Altus never needs that. We only ever want the identity assertion.
- **The Client ID is public, the verification isn't.** Don't confuse "this
  value is safe to expose in the frontend" with "this value does the
  security work." The signature check against Google's keys happens
  server-side, using the raw ID token — the frontend just relays it.
- **Google's button is a real iframe**, not a div you fully control with
  CSS — you can pick from its built-in `theme`/`shape`/`size` options, but
  can't restyle its internals. Its `width` prop also only accepts numbers in
  roughly a 200–400px range; asking for something outside that can make it
  fail to render.

---

## 7. Where this maps in the real project

| Step | Real file |
|---|---|
| 2: Client ID config | `.env` → `VITE_GOOGLE_CLIENT_ID` |
| 3: Provider wrapper | `src/main.tsx` → `<GoogleOAuthProvider>` |
| 4: API exchange call | `src/api/auth.tsx` → `googleAuth()` |
| 5: Button + success handler | `src/pages/Login/Login.tsx` → `<GoogleLogin>` / `handleGoogleSuccess` |
| Session storage (shared with password login) | `src/context/AuthContext.tsx` → `login()` |
| Backend contract (all 3 resolution paths, error codes) | `docs/API-specifications.md` → `POST /auth/google` |

See [docs/API-specifications.md](./API-specifications.md) for the exact
request/response JSON and error cases, and
[docs/lesson-log.md](./lesson-log.md) if you want to log any follow-up
questions from this topic once you're in the real code.
