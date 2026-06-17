# MoveVerse

A gamified fitness application that tracks user's motion using Mediapipe.

## Git pre-commit hook

A pre-commit hook is a script, Git runs automatically every time you git commit. If the script exits with an error, the commit is blocked.
This project uses Husky a Javascript Library that functions as Git hooks automation tool

## Setup (new team members)

Just install dependencies —
`.husky/pre-commit` | The hook script. Runs `npx lint-staged` on commit.
`.prettierrc` | Prettier's formatting rules (quotes, indentation, line width)
`.prettierignore` | Files/folders Prettier should skip (build output, deps).
