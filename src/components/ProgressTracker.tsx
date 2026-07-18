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

function RaceTrack({
  percent,
  done,
  runnerEmoji,
  accentClass,
}: {
  percent: number;
  done: boolean;
  runnerEmoji: string;
  accentClass: string;
}) {
  return (
    <div className={`race ${accentClass}`}>
      <div className="race__track">
        <div className="race__fill" style={{ width: `${percent}%` }} />
        <div
          className="race__runner"
          style={{ left: `${percent}%` }}
          aria-hidden="true"
        >
          <span className="race__runner-emoji">{runnerEmoji}</span>
        </div>
        <span className="race__start" aria-hidden="true">
          Start
        </span>
      </div>

      <div className={`race__finish ${done ? "race__finish--done" : ""}`}>
        <div className="race__flag" aria-hidden="true" />
        <BearMascot size={72} waving className="race__bear" />
        <span className="race__finish-label">Finish</span>
      </div>
    </div>
  );
}

export default function ProgressTracker() {
  const {
    submittedCount,
    percentComplete,
    completedSteps,
    totalSteps,
    cohortPercentComplete,
    cohortCompletedSteps,
    cohortSubmittedCount,
    cohortSize,
  } = useProgress();

  const personalDone = percentComplete >= 100;
  const cohortDone = cohortPercentComplete >= 100;
  const stepQuote =
    completedSteps > 0
      ? STEP_QUOTES[Math.min(completedSteps, STEP_QUOTES.length) - 1]
      : null;
  const quotePosition = Math.min(Math.max(percentComplete, 9), 91);

  return (
    <section id="progress" className="section progress-tracker">
      <div className="container">
        <div className="progress-tracker__head">
          <div>
            <span className="eyebrow">Cohort 4 · Live progress</span>
            <h2 className="section-title">Race to the finish line</h2>
            <p className="section-lead">
              {personalDone && cohortDone
                ? "Incredible — you and the cohort have crossed the finish line!"
                : "Your personal track runs beside the cohort track — every registration, submission, and peer vote moves the swarm forward."}
            </p>
          </div>
        </div>

        <div className="progress-tracker__lanes">
          <div className="progress-lane">
            <div className="progress-lane__label">
              <div>
                <span className="progress-lane__eyebrow">You</span>
                <h3 className="progress-lane__title">Personal progress</h3>
              </div>
              <div className="progress-tracker__stat">
                <span className="progress-tracker__pct">{percentComplete}%</span>
                <span className="progress-tracker__pct-label">
                  {completedSteps} of {totalSteps} steps · {submittedCount}/6
                  projects
                </span>
              </div>
            </div>
            <RaceTrack
              percent={percentComplete}
              done={personalDone}
              runnerEmoji="🚀"
              accentClass="race--personal"
            />
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

          <div className="progress-lane">
            <div className="progress-lane__label">
              <div>
                <span className="progress-lane__eyebrow">Cohort · {cohortSize}</span>
                <h3 className="progress-lane__title">Cohort progress</h3>
              </div>
              <div className="progress-tracker__stat">
                <span className="progress-tracker__pct progress-tracker__pct--cohort">
                  {cohortPercentComplete}%
                </span>
                <span className="progress-tracker__pct-label">
                  {cohortCompletedSteps} of {totalSteps} steps ·{" "}
                  {cohortSubmittedCount}/6 weeks active
                </span>
              </div>
            </div>
            <RaceTrack
              percent={cohortPercentComplete}
              done={cohortDone}
              runnerEmoji="🐻"
              accentClass="race--cohort"
            />
          </div>
        </div>
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
