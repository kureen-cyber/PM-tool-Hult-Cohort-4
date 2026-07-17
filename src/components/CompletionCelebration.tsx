import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useProgress } from "../context/ProgressContext";
import { useTheme } from "../theme/ThemeContext";
import BearMascot from "./BearMascot";
import "./CompletionCelebration.css";

const SESSION_KEY = "ludwitt-completion-celebrated";
const CELEBRATION_MS = 9000;

export default function CompletionCelebration() {
  const { percentComplete } = useProgress();
  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const originalTheme = useRef(theme);
  const timer = useRef<number | null>(null);

  const finish = useCallback(() => {
    setVisible(false);
    setTheme(originalTheme.current);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, [setTheme]);

  useEffect(() => {
    if (percentComplete < 100) {
      window.sessionStorage.removeItem(SESSION_KEY);
      if (visible) finish();
      return;
    }
    if (window.sessionStorage.getItem(SESSION_KEY)) return;

    window.sessionStorage.setItem(SESSION_KEY, "true");
    originalTheme.current = theme;
    setTheme("dark");
    setVisible(true);
    timer.current = window.setTimeout(finish, CELEBRATION_MS);
  }, [finish, percentComplete, setTheme, theme, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [finish, visible]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  if (!visible) return null;

  return (
    <div className="celebration" role="dialog" aria-modal="true" aria-label="Course completed">
      <div className="celebration__sky" aria-hidden="true">
        {Array.from({ length: 54 }, (_, index) => (
          <span
            key={index}
            className="celebration__confetti"
            style={
              {
                "--x": `${(index * 37) % 100}%`,
                "--delay": `${(index % 12) * -0.18}s`,
                "--duration": `${2.4 + (index % 7) * 0.18}s`,
                "--color": ["#ef2b3a", "#ffd166", "#57c680", "#76cfe9", "#ffffff"][
                  index % 5
                ],
              } as CSSProperties
            }
          />
        ))}
        {[0, 1, 2].map((group) => (
          <span
            key={group}
            className={`celebration__firework celebration__firework--${group + 1}`}
          >
            {Array.from({ length: 12 }, (_, ray) => (
              <i
                key={ray}
                style={{ transform: `rotate(${ray * 30}deg)` }}
              />
            ))}
          </span>
        ))}
      </div>

      <div className="celebration__content">
        <BearMascot size={150} waving />
        <span className="celebration__eyebrow">100% complete</span>
        <h2>You crossed the finish line!</h2>
        <p>
          Every project is submitted. You built, learned, and shipped your way
          through the Hult International Business School Developer Program.
        </p>
        <button type="button" className="btn btn-primary" onClick={finish}>
          Celebrate!
        </button>
      </div>
    </div>
  );
}
