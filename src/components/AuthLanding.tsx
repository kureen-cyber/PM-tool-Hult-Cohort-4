import { useEffect, useState } from "react";
import LoginModal from "./LoginModal";
import Registration from "./Registration";
import ThemeToggle from "./ThemeToggle";
import "./AuthLanding.css";

type AuthMode = "welcome" | "login" | "register";

interface AuthLandingProps {
  onAuthenticated: () => void;
}

export default function AuthLanding({ onAuthenticated }: AuthLandingProps) {
  const [mode, setMode] = useState<AuthMode>("welcome");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode]);

  return (
    <div className="auth-landing">
      <header className="auth-landing__top">
        <div className="auth-landing__brand">
          <span className="auth-landing__mark" aria-hidden="true">
            HULT
          </span>
          <div>
            <p className="auth-landing__name">
              Hult International Business School
            </p>
            <p className="auth-landing__sub">Developer Program · Cohort 4</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="auth-landing__main">
        {mode === "welcome" && (
          <section className="auth-landing__card">
            <span className="eyebrow">Participant access</span>
            <h1>Sign in to open the PM workspace</h1>
            <p>
              Projects, tasks, peer reviews, and progress are available only
              after you register or log in with any email address.
            </p>
            <div className="auth-landing__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>
          </section>
        )}

        {mode === "register" && (
          <div className="auth-landing__register">
            <button
              type="button"
              className="auth-landing__back"
              onClick={() => setMode("welcome")}
            >
              ← Back
            </button>
            <Registration onRegistered={onAuthenticated} />
          </div>
        )}
      </main>

      <LoginModal
        open={mode === "login"}
        required
        onClose={() => setMode("welcome")}
        onRegister={() => setMode("register")}
        onSuccess={onAuthenticated}
      />
    </div>
  );
}
