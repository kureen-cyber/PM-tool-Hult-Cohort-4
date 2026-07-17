import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { MILESTONES, type Milestone } from "../data/milestones";
import "./PeerReview.css";

interface TechnicalReview {
  id: string;
  reviewer: string;
  comment: string;
  createdAt: string;
}

type ReviewStore = Record<string, TechnicalReview[]>;

const STORAGE_KEY = "hult-peer-technical-reviews";

function loadReviews(): ReviewStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewStore) : {};
  } catch {
    return {};
  }
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `review-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PeerReview() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewStore>(loadReviews);

  function addReview(week: string, reviewer: string, comment: string) {
    const next = {
      ...reviews,
      [week]: [
        ...(reviews[week] ?? []),
        {
          id: makeId(),
          reviewer: reviewer.trim(),
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setReviews(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <section className="section peer-review">
      <div className="container">
        <div className="peer-review__head">
          <div>
            <span className="eyebrow">Technical feedback</span>
            <h2 className="section-title">Peer Review</h2>
            <p className="section-lead">
              One card per weekly deliverable. Every participant in the cohort
              can add a technical analysis review — all feedback collates under
              that week's submission, and everyone can see where each
              colleague's submission lives.
            </p>
          </div>
          <div className="peer-review__count">
            <strong>{MILESTONES.length}</strong>
            <span>weekly submissions</span>
          </div>
        </div>

        <div className="peer-review__grid">
          {MILESTONES.map((milestone) => (
            <SubmissionCard
              key={milestone.week}
              milestone={milestone}
              reviews={reviews[milestone.week] ?? []}
              defaultReviewer={user?.email ?? ""}
              onAddReview={addReview}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface SubmissionCardProps {
  milestone: Milestone;
  reviews: TechnicalReview[];
  defaultReviewer: string;
  onAddReview: (week: string, reviewer: string, comment: string) => void;
}

function SubmissionCard({
  milestone,
  reviews,
  defaultReviewer,
  onAddReview,
}: SubmissionCardProps) {
  const { submissions, participants } = useProgress();
  const [reviewer, setReviewer] = useState(defaultReviewer);
  const [comment, setComment] = useState("");

  const submission = submissions[milestone.week];
  const cardId = milestone.week.replace(/\s+/g, "-").toLowerCase();
  const sorted = [...reviews].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!reviewer.trim() || !comment.trim()) return;
    onAddReview(milestone.week, reviewer, comment);
    setComment("");
  }

  return (
    <article className="submission-card">
      <div className="submission-card__top">
        <span className="submission-card__number">{milestone.week}</span>
        <span
          className={`submission-card__status ${
            submission ? "is-ready" : ""
          }`}
        >
          {submission ? "Ready to review" : "Awaiting submission"}
        </span>
      </div>
      <h3>{milestone.deliverable}</h3>
      <p className="submission-card__owner">{milestone.theme}</p>

      <div className="submission-card__artifact">
        {submission ? (
          /^https?:\/\//.test(submission.reference) ? (
            <a href={submission.reference} target="_blank" rel="noreferrer">
              Open submission ↗
            </a>
          ) : (
            <span>📎 {submission.reference}</span>
          )
        ) : (
          <span>
            The submission for {milestone.week} will appear here once it's
            turned in on the Milestones tab.
          </span>
        )}
        {submission && (
          <span className="submission-card__meta">
            Submitted {new Date(submission.submittedAt).toLocaleString()}
          </span>
        )}
      </div>

      <form className="technical-review" onSubmit={submitReview}>
        <label htmlFor={`${cardId}-reviewer`}>Reviewer</label>
        <input
          id={`${cardId}-reviewer`}
          type="text"
          list="peer-review-participants"
          value={reviewer}
          onChange={(event) => setReviewer(event.target.value)}
          placeholder="Your name or student email"
          required
        />
        <datalist id="peer-review-participants">
          {participants.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <label htmlFor={`${cardId}-comment`}>Technical analysis</label>
        <textarea
          id={`${cardId}-comment`}
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Discuss architecture, code quality, testing, performance, security, and a concrete improvement…"
          required
        />
        <button type="submit" className="btn btn-primary">
          Add technical review
        </button>
      </form>

      <div className="submission-card__reviews">
        <span className="submission-card__reviews-title">
          {sorted.length === 0
            ? "No technical reviews yet — be the first."
            : `${sorted.length} technical ${
                sorted.length === 1 ? "review" : "reviews"
              }`}
        </span>
        {sorted.map((review) => (
          <blockquote key={review.id}>
            <p>{review.comment}</p>
            <footer>
              {review.reviewer} ·{" "}
              {new Date(review.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </footer>
          </blockquote>
        ))}
      </div>
    </article>
  );
}
