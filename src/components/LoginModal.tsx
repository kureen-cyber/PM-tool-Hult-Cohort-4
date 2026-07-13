import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth, ROLE_LABELS, type Role } from "../context/AuthContext";
import "./LoginModal.css";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export default function LoginModal({
  open,
  onClose,
  onRegister,
}: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    // Demo auth: role is selected by the user. Replace with a real backend
    // that returns the authenticated user's role.
    login(email.trim(), role);
    setPassword("");
    onClose();
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
            LA
          </span>
        </div>
        <h2 id="login-title" className="modal__title">
          Welcome back
        </h2>
        <p className="modal__subtitle">
          Log in to your Ludwitt Academy workspace.
        </p>

        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          <div className="field">
            <label htmlFor="login-email" className="field__label">
              Email address
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
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="field">
            <div className="modal__label-row">
              <label htmlFor="login-password" className="field__label">
                Password
              </label>
              <button type="button" className="modal__link modal__link-btn">
                Forgot?
              </button>
            </div>
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

          <div className="field">
            <label htmlFor="login-role" className="field__label">
              Sign in as
            </label>
            <div className="field__control">
              <select
                id="login-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="field__error modal__error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block">
            Log In
          </button>
        </form>

        <p className="modal__footer">
          New to the cohort?{" "}
          <button
            type="button"
            className="modal__link modal__link-btn"
            onClick={onRegister}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
