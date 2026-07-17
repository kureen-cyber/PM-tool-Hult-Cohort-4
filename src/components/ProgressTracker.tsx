import BearMascot from "./BearMascot";
import { MILESTONES } from "../data/milestones";
import { useProgress } from "../context/ProgressContext";
import "./ProgressTracker.css";

// One quote per completed step (registration + the six weekly projects),
// shown under the progress bar at the runner's current position.
const STEP_QUOTES = [
  "Keep moving forward",
  "Success starts with courage",
  "Discipline creates freedom",
  "Progress over perfection",
  "Rise above every challenge",
  "Dream. Believe. Achieve",
  "Your potential is limitless",
];

export default function ProgressTracker() {
  const {
    submittedCount,
    percentComplete,
    completedSteps,
    totalSteps,
  } = useProgress();

  const done = percentComplete >= 100;
  const stepQuote =
    completedSteps > 0
      ? STEP_QUOTES[Math.min(completedSteps, STEP_QUOTES.length) - 1]
      : null;
  // Keep the quote from spilling past the track's edges.
  const quotePosition = Math.min(Math.max(percentComplete, 9), 91);

  return (
    <section id="progress" className="section progress-tracker">
      <div className="container">
        <div className="progress-tracker__head">
          <div>
            <span className="eyebrow">Cohort 4 · Live progress</span>
            <h2 className="section-title">Race to the finish line</h2>
            <p className="section-lead">
              {done
                ? "Incredible — every project is in. The grizzly is proud of the whole swarm!"
                : "Every submitted project moves you closer. The grizzly is waiting at the finish line, cheering you on."}
            </p>
          </div>
          <div className="progress-tracker__stat">
            <span className="progress-tracker__pct">{percentComplete}%</span>
            <span className="progress-tracker__pct-label">
              {completedSteps} of {totalSteps} steps · {submittedCount}/6
              projects submitted
            </span>
          </div>
        </div>

        {/* Race track */}
        <div className="race">
          <div className="race__track">
            <div
              className="race__fill"
              style={{ width: `${percentComplete}%` }}
            />
            <div
              className="race__runner"
              style={{ left: `${percentComplete}%` }}
              aria-hidden="true"
            >
              <span className="race__runner-emoji">🚀</span>
            </div>
            <span className="race__start" aria-hidden="true">
              Start
            </span>
          </div>

          <div className={`race__finish ${done ? "race__finish--done" : ""}`}>
            <div className="race__flag" aria-hidden="true" />
            <BearMascot size={92} waving className="race__bear" />
            <span className="race__finish-label">Finish</span>
          </div>
        </div>

        {stepQuote && (
          <div className="race__quote-row" aria-live="polite">
            <div className="race__quote-lane">
              <span
                key={completedSteps}
                className="race__quote"
                style={{ left: `${quotePosition}%` }}
              >
                “{stepQuote}”
              </span>
            </div>
            <div className="race__quote-spacer" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}

export function ProgressSteps() {
  const { submissions, registeredStep } = useProgress();

  return (
    <section className="progress-steps" aria-label="Course steps">
      <div className="container">
        <div className="progress-tracker__grid">
          <div
            className={`prog-item ${
              registeredStep ? "prog-item--done" : ""
            }`}
          >
            <span className="prog-item__check" aria-hidden="true">
              {registeredStep ? "✓" : ""}
            </span>
            <div className="prog-item__body">
              <span className="prog-item__week">Step 1</span>
              <span className="prog-item__name">Registration</span>
              {registeredStep && (
                <span className="prog-item__meta">Your first move — done!</span>
              )}
            </div>
            <span
              className={`prog-item__status ${
                registeredStep ? "is-done" : "is-pending"
              }`}
            >
              {registeredStep ? "Registered" : "Pending"}
            </span>
          </div>
          {MILESTONES.map((m) => {
            const submission = submissions[m.week];
            const isDone = Boolean(submission);
            return (
              <div
                key={m.week}
                className={`prog-item ${isDone ? "prog-item--done" : ""}`}
              >
                <span className="prog-item__check" aria-hidden="true">
                  {isDone ? "✓" : ""}
                </span>
                <div className="prog-item__body">
                  <span className="prog-item__week">{m.week}</span>
                  <span className="prog-item__name">{m.deliverable}</span>
                  {submission && (
                    <span className="prog-item__meta">
                      Submitted ·{" "}
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span
                  className={`prog-item__status ${
                    isDone ? "is-done" : "is-pending"
                  }`}
                >
                  {isDone ? "Submitted" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
