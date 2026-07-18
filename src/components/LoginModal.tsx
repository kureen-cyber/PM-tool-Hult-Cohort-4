import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import "./LoginModal.css";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
}

function mapAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    default:
      return error instanceof Error
        ? error.message
        : "Unable to sign in. Please try again.";
  }
}

export default function LoginModal({
  open,
  onClose,
  onRegister,
}: LoginModalProps) {
  const {
    login,
    firebaseEnabled,
    refreshEmailVerification,
    resendVerificationEmail,
    user,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    emailRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!firebaseEnabled) {
      setError(
        "Firebase is not configured. Real participant login is required — add VITE_FIREBASE_* to .env.local."
      );
      return;
    }

    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      setPassword("");
      setInfo(
        "Signed in. If you haven't verified your email yet, check your inbox."
      );
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshVerification() {
    setBusy(true);
    setError(null);
    try {
      const verified = await refreshEmailVerification();
      setInfo(
        verified
          ? "Email verified — you're all set."
          : "Still unverified. Open the link in your email, then try again."
      );
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setInfo("Verification email resent.");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          className="modal__close"
          aria-label="Close login"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal__brand">
          <span className="modal__mark" aria-hidden="true">
            HULT
          </span>
        </div>
        <h2 id="login-title" className="modal__title">
          Participant sign-in
        </h2>
        <p className="modal__subtitle">
          Use your real cohort account credentials. Demo login is disabled —
          Firebase Auth scales across the full cohort.
        </p>

        {!firebaseEnabled && (
          <p className="modal__banner" role="alert">
            Firebase is not configured. Add <code>.env.local</code> from{" "}
            <code>.env.example</code> before participants can sign in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          <div className="field">
            <label htmlFor="login-email" className="field__label">
              Cohort email
            </label>
            <div className="field__control">
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@hult.edu"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password" className="field__label">
              Password
            </label>
            <div className="field__control">
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="field__error modal__error">{error}</p>}
          {info && <p className="modal__info">{info}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy || !firebaseEnabled}
          >
            {busy ? "Signing in…" : "Log In"}
          </button>
        </form>

        {firebaseEnabled && user && !user.emailVerified && (
          <div className="modal__verify-actions">
            <button
              type="button"
              className="btn btn-ghost btn-block"
              disabled={busy}
              onClick={handleRefreshVerification}
            >
              I've verified — refresh status
            </button>
            <button
              type="button"
              className="modal__link modal__link-btn"
              disabled={busy}
              onClick={handleResend}
            >
              Resend verification email
            </button>
          </div>
        )}

        {firebaseEnabled && user?.emailVerified && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onClose}
          >
            Continue to workspace
          </button>
        )}

        <p className="modal__footer">
          New to the cohort?{" "}
          <button
            type="button"
            className="modal__link modal__link-btn"
            onClick={onRegister}
          >
            Register with your participant email
          </button>
        </p>
      </div>
    </div>
  );
}
