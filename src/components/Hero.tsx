import type { View } from "../navigation";
import "./Hero.css";

const STATS = [
  { value: "6", label: "Weeks intensive" },
  { value: "60+", label: "Live project hours" },
];

interface HeroProps {
  onNavigate: (view: View) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section id="hero" className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="eyebrow">Forward Deployed Engineers · Cohort 4</span>
          <h1 className="hero__title">
            From Problem Discovery to
            <span className="hero__title-accent"> AI-Powered Delivery</span>
          </h1>
          <p className="hero__lead">
            The Ludwitt Academy PM tool keeps your cohort aligned — track curriculum
            milestones, manage project deliverables, and turn ambitious
            engineers into trusted forward deployed partners.
          </p>
          <div className="hero__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate("register")}
            >
              Register for Cohort 4
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onNavigate("curriculum")}
            >
              Explore the curriculum
            </button>
          </div>
          <dl className="hero__stats">
            {STATS.map((s) => (
              <div key={s.label} className="hero__stat">
                <dt className="hero__stat-value">{s.value}</dt>
                <dd className="hero__stat-label">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero__panel" aria-hidden="true">
          <div className="hero__panel-head">
            <span className="hero__dot" />
            <span className="hero__dot" />
            <span className="hero__dot" />
            <span className="hero__panel-title">Cohort 4 · Sprint board</span>
          </div>
          <div className="hero__cards">
            <HeroCard
              track="Onboarding"
              title="Deployment fundamentals"
              progress={100}
              status="done"
            />
            <HeroCard
              track="Client work"
              title="Customer integration lab"
              progress={72}
              status="active"
            />
            <HeroCard
              track="Capstone"
              title="Forward deployment sim"
              progress={28}
              status="upcoming"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface HeroCardProps {
  track: string;
  title: string;
  progress: number;
  status: "done" | "active" | "upcoming";
}

function HeroCard({ track, title, progress, status }: HeroCardProps) {
  return (
    <div className="hero-card">
      <div className="hero-card__top">
        <span className="hero-card__track">{track}</span>
        <span className={`hero-card__badge hero-card__badge--${status}`}>
          {status}
        </span>
      </div>
      <p className="hero-card__title">{title}</p>
      <div className="hero-card__bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="hero-card__pct">{progress}% complete</span>
    </div>
  );
}
