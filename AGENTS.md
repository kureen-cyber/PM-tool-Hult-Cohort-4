# AGENTS.md — Hult Cohort 4 PM Tool

Instructions for AI coding agents working in this repository.

## North star

A Vite + React project-management workspace for the Hult Developer Program (Forward Deployed Engineers). Participants register and sign in with **real Firebase Auth**, manage **projects/tasks**, peer-review weekly work, and track personal + cohort progress.

**Production:** https://pm-tool-hult-cohort-4.vercel.app/  
**Local:** `npm run dev` → http://localhost:5173/

## Stack

- Vite 5 · React 18 · TypeScript
- Firebase Auth + Firestore (`src/lib/firebase.ts`, `src/lib/users.ts`, `src/lib/pm.ts`)
- CSS custom properties / modules (no Tailwind)
- Vercel hosting — SPA rewrites in `vercel.json`

## Key paths

| Area | Path |
|------|------|
| App shell / tabs | `src/App.tsx`, `src/navigation.ts` |
| Auth | `src/context/AuthContext.tsx`, `src/components/LoginModal.tsx`, `src/components/Registration.tsx` |
| Projects & tasks | `src/context/PmContext.tsx`, `src/components/ProjectsBoard.tsx`, `src/types/pm.ts` |
| Peer review + votes | `src/components/PeerReview.tsx`, `src/context/ProgressContext.tsx` |
| Progress bars | `src/components/ProgressTracker.tsx` |
| Settings / AI | `src/components/Settings.tsx`, `src/components/AiAssistant.tsx` |
| Firebase docs/rules | `FIREBASE.md`, `firestore.rules` |

## Agent role map

| Task type | Agent | Notes |
|-----------|-------|--------|
| Repo exploration | Research | Prefer reading `AGENTS.md`, `README.md`, `FIREBASE.md` first |
| Feature implementation | Development | Cursor — match existing patterns; minimal diffs |
| Review / build | QA | `npm run typecheck` and `npm run build` before finishing |

## Conventions

1. **Minimal diffs** — fix the task; don’t refactor unrelated code.
2. **No secrets** — never commit `.env.local`, service accounts, or API keys. Use `.env.example`.
3. **Real auth only** — demo login is disabled; Firebase must be configured for sign-in/register.
4. **Client vs secrets** — only `VITE_*` vars are available in the browser; do not put private keys in Vite env.
5. **SPA routing** — this app is client-routed via view state (not React Router paths). Keep `vercel.json` rewrite so refreshes don’t 404.
6. **Brand** — red/white/ink tokens in `src/index.css`; preserve light/dark theme via `ThemeContext`.

## Commands

```bash
cp .env.example .env.local   # fill Firebase web config
npm install
npm run dev                  # http://localhost:5173
npm run build                # tsc + vite build
npm run typecheck
```

## Before finishing

- Run `npm run build` (or at least `npm run typecheck`) for UI/auth/PM changes.
- If you change Firestore collections or auth rules, update `firestore.rules` and `FIREBASE.md`.
