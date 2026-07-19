import { useMemo } from "react";
import BearMascot from "./BearMascot";
import { useAuth } from "../context/AuthContext";
import { usePm } from "../context/PmContext";
import { useProgress } from "../context/ProgressContext";
import "./ProgressTracker.css";

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

/** Personal bar: login/registration floor + PM task completion (+ weekly submits). */
function usePersonalProgressPercent() {
  const { user } = useAuth();
  const { registeredStep, submittedCount, totalSteps } = useProgress();
  const { projects, tasks } = usePm();

  return useMemo(() => {
    if (!user) {
      return {
        percent: 0,
        completedSteps: 0,
        totalSteps,
        label: "Sign in to start your race",
      };
    }

    const activeProjects = projects.filter((project) => !project.archived);
    let taskDone = 0;
    let taskTotal = 0;
    for (const project of activeProjects) {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      taskTotal += projectTasks.length;
      taskDone += projectTasks.filter((task) => task.status === "done").length;
    }

    // Floor for signed-in + registered (~14% of a 7-step track).
    const loginFloor = registeredStep ? Math.round(100 / totalSteps) : 10;
    const remaining = 100 - loginFloor;

    let workPercent = 0;
    if (taskTotal > 0) {
      workPercent = (taskDone / taskTotal) * remaining;
    } else if (submittedCount > 0) {
      workPercent = (submittedCount / 6) * remaining;
    } else if (activeProjects.length > 0) {
      // Created projects but no tasks yet — small credit for getting started.
      workPercent = Math.min(remaining * 0.15, 8);
    }

    const percent = Math.min(100, Math.round(loginFloor + workPercent));
    const completedSteps = Math.max(
      1,
      Math.round((percent / 100) * totalSteps)
    );

    const label =
      taskTotal > 0
        ? `${taskDone}/${taskTotal} tasks done · ${activeProjects.length} projects`
        : registeredStep
          ? `Registered · ${submittedCount}/6 weekly submits`
          : "Signed in — finish registration sync";

    return { percent, completedSteps, totalSteps, label };
  }, [
    projects,
    registeredStep,
    submittedCount,
    tasks,
    totalSteps,
    user,
  ]);
}

export default function ProgressTracker() {
  const {
    cohortPercentComplete,
    cohortCompletedSteps,
    cohortSubmittedCount,
    cohortSize,
    totalSteps,
  } = useProgress();

  const personal = usePersonalProgressPercent();
  const personalDone = personal.percent >= 100;
  const cohortDone = cohortPercentComplete >= 100;
  const stepQuote =
    personal.completedSteps > 0
      ? STEP_QUOTES[Math.min(personal.completedSteps, STEP_QUOTES.length) - 1]
      : null;
  const quotePosition = Math.min(Math.max(personal.percent, 9), 91);

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
                : "Your personal track moves when you sign in and complete project tasks. The cohort track reflects shared registration and weekly activity."}
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
                <span className="progress-tracker__pct">{personal.percent}%</span>
                <span className="progress-tracker__pct-label">
                  {personal.label}
                </span>
              </div>
            </div>
            <RaceTrack
              percent={personal.percent}
              done={personalDone}
              runnerEmoji="🚀"
              accentClass="race--personal"
            />
            {stepQuote && (
              <div className="race__quote-row" aria-live="polite">
                <div className="race__quote-lane">
                  <span
                    key={personal.completedSteps}
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
                <span className="progress-lane__eyebrow">
                  Cohort · {cohortSize}
                </span>
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
