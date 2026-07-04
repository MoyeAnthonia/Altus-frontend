# Altus

A gamified fitness application that tracks user's motion using Mediapipe.

## Prerequisites

- [Vite](https://vite.dev/guide/) npm install -D vite
- [Node.js](https://nodejs.org/en/download)
- Git

## Getting started

```bash
git clone <repo-url>
cd Altus-frontend
```

## Running the app

```bash
npm install
npm run dev
```

Check it is running:

http://localhost:5173/

## Environment variables

This project needs a `.env` file in the project root with the API base URL:

1. Create a file named `.env` in the root of the project (same level as `package.json`).
2. Add the following:

```dotenv
   VITE_API_BASE_URL=https://api.altus.games
```

3. Restart the dev server (`npm run dev`) if it was already running

## Git pre-commit hook

A pre-commit hook is a script, Git runs automatically every time you git commit. If the script exits with an error, the commit is blocked.

Run `npx lint-staged` on terminal before commit to check for errors.
This project uses Husky a Javascript Library that functions as Git hooks automation tool

## Setup (new team members)

Just install dependencies —
`.husky/pre-commit` | The hook script. Runs `npx lint-staged` on commit.
`.prettierrc` | Prettier's formatting rules (quotes, indentation, line width)
`.prettierignore` | Files/folders Prettier should skip (build output, deps).
