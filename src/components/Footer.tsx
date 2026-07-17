import { NAV_ITEMS, type View } from "../navigation";
import "./Footer.css";

interface FooterProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export default function Footer({ activeView, onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__mark" aria-hidden="true">
            HULT
          </span>
          <div>
            <p className="footer__name">Hult International Business School</p>
            <p className="footer__tagline">
              Training the next generation of forward deployed engineers.
            </p>
          </div>
        </div>
        <nav className="footer__links" aria-label="Footer">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={`footer__link ${
                activeView === item.view ? "is-active" : ""
              }`}
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} Hult International Business School
        </span>
        <span>Built for the Hult program</span>
      </div>
    </footer>
  );
}
