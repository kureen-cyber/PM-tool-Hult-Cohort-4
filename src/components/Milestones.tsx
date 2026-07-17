import { useState, type ChangeEvent } from "react";
import { MILESTONES, type Milestone } from "../data/milestones";
import { useProgress } from "../context/ProgressContext";
import "./Milestones.css";

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function Milestones() {
  return (
    <section id="milestones" className="section milestones">
      <div className="container">
        <div className="milestones__head">
          <span className="eyebrow">Milestone tracking</span>
          <h2 className="section-title">Six weeks, six shipped deliverables</h2>
          <p className="section-lead">
            Each week has a build target, a submission slot, a space to reflect
            on your challenges, and a peer vote — every submission moves the
            cohort closer to the finish line.
          </p>
        </div>

        <div className="milestones__list">
          {MILESTONES.map((m) => (
            <MilestoneCard key={m.week} milestone={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const {
    submissions,
    submitProject,
    clearSubmission,
    participants,
    votes,
    myVotes,
    castVote,
  } = useProgress();
  const existing = submissions[milestone.week];
  const submitted = Boolean(existing);

  const [fileName, setFileName] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [challenges, setChallenges] = useState<string>("");
  const [selectedVote, setSelectedVote] = useState<string>("");

  const inputId = `submit-${milestone.week.replace(/\s+/g, "-").toLowerCase()}`;
  const challengesId = `challenges-${milestone.week
    .replace(/\s+/g, "-")
    .toLowerCase()}`;
  const voteId = `vote-${milestone.week.replace(/\s+/g, "-").toLowerCase()}`;

  const myVote = myVotes[milestone.week];
  const weekVotes = votes[milestone.week] ?? {};
  const leaderboard = Object.entries(weekVotes).sort((a, b) => b[1] - a[1]);
  const totalVotes = leaderboard.reduce((sum, [, count]) => sum + count, 0);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  }

  function handleSubmit() {
    const reference = fileName || link.trim();
    if (!reference) return;
    submitProject(milestone.week, reference, challenges.trim());
    setFileName("");
    setLink("");
    setChallenges("");
  }

  function handleUndo() {
    clearSubmission(milestone.week);
  }

  function handleVote() {
    if (!selectedVote || myVote) return;
    castVote(milestone.week, selectedVote);
    setSelectedVote("");
  }

  const canSubmit = Boolean(fileName || link.trim());

  return (
    <article className={`milestone ${submitted ? "milestone--done" : ""}`}>
      <div className="milestone__main">
        <div className="milestone__top">
          <span className="milestone__week">{milestone.week}</span>
          <span className="milestone__theme">{milestone.theme}</span>
          {milestone.reviewWeek && (
            <span className="milestone__tag">Review week</span>
          )}
          {submitted && (
            <span className="milestone__status" role="status">
              ✓ Submitted
            </span>
          )}
        </div>
        <h3 className="milestone__deliverable">{milestone.deliverable}</h3>
        <p className="milestone__desc">{milestone.description}</p>
        <dl className="milestone__deadlines">
          <div>
            <dt>Submission due</dt>
            <dd>{DEADLINE_FORMAT.format(new Date(milestone.submissionDeadline))}</dd>
          </div>
          <div>
            <dt>Review &amp; vote due</dt>
            <dd>{DEADLINE_FORMAT.format(new Date(milestone.reviewDeadline))}</dd>
          </div>
        </dl>
      </div>

      <div className="milestone__submit">
        {submitted ? (
          <div className="milestone__submitted">
            <p className="milestone__submitted-ref">
              <span aria-hidden="true">📎</span> {existing?.reference}
            </p>
            {existing?.challenges && (
              <p className="milestone__submitted-challenges">
                <strong>Challenges:</strong> {existing.challenges}
              </p>
            )}
            <p className="milestone__submitted-meta">
              Submitted{" "}
              {existing ? new Date(existing.submittedAt).toLocaleString() : ""}
            </p>
            <button
              type="button"
              className="btn btn-ghost milestone__btn"
              onClick={handleUndo}
            >
              Replace submission
            </button>
          </div>
        ) : (
          <>
            <label className="milestone__dropzone" htmlFor={inputId}>
              <span className="milestone__drop-icon" aria-hidden="true">
                ↥
              </span>
              <span className="milestone__drop-text">
                {fileName ? (
                  <strong>{fileName}</strong>
                ) : (
                  <>
                    <strong>Upload submission</strong>
                    <span className="milestone__drop-hint">
                      Drag a file here or browse
                    </span>
                  </>
                )}
              </span>
              <input
                id={inputId}
                type="file"
                className="milestone__file"
                onChange={handleFile}
              />
            </label>

            <div className="milestone__link-row">
              <input
                type="url"
                className="milestone__link"
                placeholder="…or paste a submission link (https://…)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div className="milestone__challenges">
              <label htmlFor={challengesId} className="milestone__sub-label">
                What challenges did you face completing this task?
              </label>
              <textarea
                id={challengesId}
                rows={3}
                className="milestone__textarea"
                placeholder="Describe the blockers, tricky bugs, or trade-offs you worked through…"
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary milestone__btn milestone__submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Submit project
            </button>
          </>
        )}

        {/* Peer vote */}
        <div className="milestone__vote">
          <span className="milestone__sub-label">
            Peer vote — who nailed {milestone.week}?
          </span>
          {myVote ? (
            <p className="milestone__voted" role="status">
              <span aria-hidden="true">🗳️</span> You voted for{" "}
              <strong>{myVote}</strong>. Thanks — one vote per person!
            </p>
          ) : (
            <div className="milestone__vote-row">
              <select
                id={voteId}
                className="milestone__vote-select"
                value={selectedVote}
                onChange={(e) => setSelectedVote(e.target.value)}
                aria-label={`Vote for the best ${milestone.week} submission`}
              >
                <option value="">Select a participant…</option>
                {participants.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary milestone__btn"
                onClick={handleVote}
                disabled={!selectedVote}
              >
                Vote
              </button>
            </div>
          )}

          {totalVotes > 0 && (
            <ul className="milestone__tally">
              {leaderboard.map(([name, count]) => (
                <li key={name} className="milestone__tally-item">
                  <span className="milestone__tally-name">{name}</span>
                  <span className="milestone__tally-bar">
                    <span
                      style={{
                        width: `${Math.round((count / totalVotes) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="milestone__tally-count">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
