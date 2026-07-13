import "./Features.css";

const FEATURES = [
  {
    icon: "◎",
    title: "Milestone tracking",
    text: "Break the 6-week program into sprints with clear deliverables, due dates, and owner assignments for every student.",
  },
  {
    icon: "⚑",
    title: "Client project pipeline",
    text: "Manage real forward-deployment engagements from kickoff to handoff, with status boards mentors can review at a glance.",
  },
  {
    icon: "◈",
    title: "Skills matrix",
    text: "Map each engineer against the FDE competency framework — from solution design to on-site customer communication.",
  },
  {
    icon: "◔",
    title: "Cohort scheduling",
    text: "Coordinate live sessions, labs, and office hours across time zones with a shared, conflict-aware calendar.",
  },
  {
    icon: "✦",
    title: "Mentor feedback loops",
    text: "Structured reviews and 1:1 notes stay attached to each deliverable so growth is visible across the cohort.",
  },
  {
    icon: "▤",
    title: "Progress analytics",
    text: "Dashboards surface at-risk students early and celebrate momentum with completion and velocity insights.",
  },
];

export default function Features() {
  return (
    <section id="features" className="section section-subtle features">
      <div className="container">
        <div className="features__head">
          <span className="eyebrow">Everything the cohort needs</span>
          <h2 className="section-title">
            One workspace, all your program requirements
          </h2>
          <p className="section-lead">
            Purpose-built project management for a hands-on engineering course —
            so instructors coach, and students ship.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-card__icon" aria-hidden="true">
                {f.icon}
              </span>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__text">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
