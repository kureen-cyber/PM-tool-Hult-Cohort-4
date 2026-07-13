import { MILESTONES } from "../data/milestones";
import { useProgress } from "../context/ProgressContext";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import "./BackOffice.css";

export default function BackOffice() {
  const { registrations, submissions, votes } = useProgress();
  const { user } = useAuth();

  return (
    <section className="section backoffice">
      <div className="container">
        <div className="backoffice__head">
          <span className="eyebrow">Staff only</span>
          <h2 className="section-title">Back office</h2>
          <p className="section-lead">
            Signed in as {user ? ROLE_LABELS[user.role] : "staff"}. Review cohort
            registrations, project submissions, and peer votes.
          </p>
        </div>

        <div className="backoffice__stats">
          <Stat label="Registered students" value={registrations.length} />
          <Stat
            label="Verified emails"
            value={registrations.filter((r) => r.emailVerified).length}
          />
          <Stat
            label="Projects submitted"
            value={Object.keys(submissions).length}
          />
        </div>

        {/* Registrations */}
        <div className="backoffice__panel">
          <h3 className="backoffice__panel-title">Registered students</h3>
          {registrations.length === 0 ? (
            <p className="backoffice__empty">No registrations yet.</p>
          ) : (
            <div className="backoffice__table-wrap">
              <table className="backoffice__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Experience</th>
                    <th>Stack</th>
                    <th>Email status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.firstName} {r.lastName}
                      </td>
                      <td>{r.email}</td>
                      <td>{r.role}</td>
                      <td>{r.experience || "—"}</td>
                      <td>{r.primaryStack || "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.emailVerified ? "badge--ok" : "badge--pending"
                          }`}
                        >
                          {r.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td>{new Date(r.registeredAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submissions + votes per week */}
        <div className="backoffice__panel">
          <h3 className="backoffice__panel-title">
            Submissions &amp; peer votes
          </h3>
          <div className="backoffice__weeks">
            {MILESTONES.map((m) => {
              const submission = submissions[m.week];
              const weekVotes = votes[m.week] ?? {};
              const leaderboard = Object.entries(weekVotes).sort(
                (a, b) => b[1] - a[1]
              );
              return (
                <div key={m.week} className="backoffice__week">
                  <div className="backoffice__week-head">
                    <span className="backoffice__week-badge">{m.week}</span>
                    <span className="backoffice__week-name">
                      {m.deliverable}
                    </span>
                  </div>

                  {submission ? (
                    <div className="backoffice__submission">
                      <p>
                        <strong>Submission:</strong> {submission.reference}
                      </p>
                      <p>
                        <strong>Challenges:</strong>{" "}
                        {submission.challenges || (
                          <em className="backoffice__muted">
                            None described
                          </em>
                        )}
                      </p>
                      <p className="backoffice__muted">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="backoffice__empty">No submission yet.</p>
                  )}

                  <div className="backoffice__votes">
                    <span className="backoffice__votes-title">Votes</span>
                    {leaderboard.length === 0 ? (
                      <span className="backoffice__muted">No votes yet.</span>
                    ) : (
                      <ul>
                        {leaderboard.map(([name, count]) => (
                          <li key={name}>
                            <span>{name}</span>
                            <span className="backoffice__vote-count">
                              {count} {count === 1 ? "vote" : "votes"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="backoffice__stat">
      <span className="backoffice__stat-value">{value}</span>
      <span className="backoffice__stat-label">{label}</span>
    </div>
  );
}
