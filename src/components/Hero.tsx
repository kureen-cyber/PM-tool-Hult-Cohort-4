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
            The Hult International Business School PM tool keeps your cohort
            aligned — track curriculum milestones, manage project deliverables,
            and turn ambitious engineers into trusted forward deployed partners.
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
              onClick={() => onNavigate("projects")}
            >
              Open projects
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
      </div>
    </section>
  );
}
