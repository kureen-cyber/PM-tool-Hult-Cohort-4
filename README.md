# Hult International Business School · Developer Program

A project management tool for running the **Forward Deployed Engineers** course.
Built with a fresh, modern red & white design, a light/dark mode toggle, a
student registration section, and a log in flow.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Firebase](https://firebase.google.com/) Auth + Firestore (optional until `.env.local` is set)
- CSS custom properties for theming (no CSS framework dependency)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill Firebase web config for real auth
npm run dev
```

Without Firebase env vars the app runs in **demo mode** (local-only auth).
See [FIREBASE.md](FIREBASE.md) for Auth, email verification, staff roles, and
Firestore rules.

## Available scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server                |
| `npm run build`   | Type-check and build for production      |
| `npm run preview` | Preview the production build locally     |

## Features

- **Red & white theme** with a fresh, modern feel.
- **Light / dark mode toggle** in the navbar. The choice is saved to
  `localStorage` and respects the OS `prefers-color-scheme` on first visit.
- **Registration section** with a full student application form (contact info,
  experience, tech stack, cohort track, motivation) plus inline validation and a
  success confirmation state.
- **Log In** button that opens an accessible modal dialog (closes on `Esc` /
  backdrop click).
- Responsive landing content: hero with a live-style sprint board, curriculum
  feature grid, and footer.

## Project structure

```
src/
├─ main.tsx                # App entry, wraps app in ThemeProvider
├─ App.tsx                 # Layout + login modal state
├─ index.css               # Design tokens (light/dark) + base styles
├─ theme/
│  └─ ThemeContext.tsx     # Theme state, persistence, system preference
└─ components/
   ├─ Navbar.tsx           # Brand, nav links, theme toggle, Log In / Register
   ├─ ThemeToggle.tsx      # Light/dark switch
   ├─ Hero.tsx             # Landing hero + sprint board preview
   ├─ Features.tsx         # Curriculum / capabilities grid
   ├─ Registration.tsx     # Student registration form + validation
   ├─ LoginModal.tsx       # Log in dialog
   └─ Footer.tsx
```

## Wiring up a backend

The registration form and login modal are UI-complete with client-side
validation. To connect them to real services, replace the placeholder logic in
`Registration.tsx` (`handleSubmit`) and `LoginModal.tsx` (`handleSubmit`) with
calls to your API.
