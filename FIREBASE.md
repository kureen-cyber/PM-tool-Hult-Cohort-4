# Firebase setup — Hult Developer Program PM Tool

This app uses **Firebase Authentication** (email/password + email verification) and **Cloud Firestore** (user profiles / roles).

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Firestore** database (start in production mode, then paste `firestore.rules`).
4. Register a **Web app** and copy the config values.

## 2. Local env

```bash
cp .env.example .env.local
```

Fill every `VITE_FIREBASE_*` value from Project settings → Your apps.

Staff allowlists (optional but recommended):

```env
VITE_STAFF_EMAILS=professor@hult.edu,coach@hult.edu
VITE_ADMIN_EMAILS=admin@hult.edu
```

Emails in these lists receive `professor` / `admin` roles when their profile is created. Everyone else is a `student`. Self-registration cannot invent staff roles (Firestore rules enforce `student` on create; elevate staff in the Console).

## 3. Deploy security rules

```bash
# If you use Firebase CLI:
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into Firestore → Rules in the Console.

## 4. Creating staff accounts

1. Register (or create the user in Authentication).
2. In Firestore → `users/{uid}`, set `role` to `professor` or `admin`.
3. Or put their email in `VITE_STAFF_EMAILS` / `VITE_ADMIN_EMAILS` **before** they register.

Staff (`professor` / `admin`) see the **Back office** tab after login.

## 5. Email verification

On register, Firebase sends a real verification email. The user must click the link, then return and click **I've verified — refresh status** (or log in again). Unverified accounts can sign in but are prompted to verify; chat and staff features expect a verified session.

## 6. Demo mode (no Firebase)

If `.env.local` is missing or incomplete, the app runs in **local demo mode**: auth/roles stay in-browser only (previous behaviour). The login and registration screens show a banner when Firebase is not configured.
