# Hult International Business School · Developer Program

A project management tool for running the **Forward Deployed Engineers** course
(Hult Cohort 4). Participants manage projects and tasks, peer-review weekly
work, cast votes, and track personal + cohort progress.

## Production

**Live deploy:** https://pm-tool-hult-cohort-4.vercel.app/

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Firebase](https://firebase.google.com/) Auth + Firestore
- CSS custom properties for theming (no CSS framework dependency)
- Hosted on [Vercel](https://vercel.com/) (`vercel.json` SPA rewrites)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill Firebase web config for real auth
npm run dev                  # http://localhost:5173
```

Firebase Auth is required for participant register/login (demo login is
disabled). See [FIREBASE.md](FIREBASE.md) for setup, email verification, staff
roles, and Firestore rules. Agent guidance: [AGENTS.md](AGENTS.md).

## Available scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server (port 5173)|
| `npm run build`     | Type-check and build for production  |
| `npm run preview`   | Preview the production build locally |
| `npm run typecheck` | TypeScript only                      |

## Features

- **Projects & tasks** — create / edit / archive projects; tasks with title,
  description, status (≥3), assignee; filters by project / status / assignee
- **Firebase Auth** — real email/password accounts that scale across the cohort
- **Peer Review** — technical reviews per weekly submission + colleague vote dropdown
- **Progress** — personal and cohort race tracks across tabs
- **Settings** + floating **AI assistant**
- **Light / dark** theme toggle (persisted)

## Project structure

```
src/
├─ main.tsx
├─ App.tsx
├─ navigation.ts
├─ index.css
├─ context/          # Auth, Progress, Pm
├─ lib/              # firebase, users, pm
├─ theme/
└─ components/       # ProjectsBoard, PeerReview, Settings, AiAssistant, …
```

## Known bugs / limitations

- **No automated test suite** — rely on `npm run build` and manual QA.
- **Cohort chat & some progress data** still use `localStorage` on the device;
  multi-user sync for chat/votes is not fully on Firestore yet.
- **Large JS bundle** (~700 kB) from the Firebase client SDK; no code-splitting
  yet (Vite build warns about chunk size).
- **Deep links / shareable paths** are limited: navigation is in-app view state
  (not URL routes). `vercel.json` rewrites prevent static 404s on refresh of
  `/index.html` hosts, but there are no per-tab URL paths yet.
- **Optional AI cloud replies** need `VITE_OPENAI_API_KEY`; without it the
  assistant uses local heuristics only.
- **Staff elevation** depends on `VITE_STAFF_EMAILS` / `VITE_ADMIN_EMAILS` or
  manual Firestore `users/{uid}.role` edits — self-serve role picking is disabled.
