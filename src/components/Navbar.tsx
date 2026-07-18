import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { NAV_ITEMS, type View } from "../navigation";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import "./Navbar.css";

interface NavbarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onLoginClick: () => void;
  onSearchClick: () => void;
}

export default function Navbar({
  activeView,
  onNavigate,
  onLoginClick,
  onSearchClick,
}: NavbarProps) {
  const { user, logout, isStaff } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(view: View) {
    onNavigate(view);
    setMenuOpen(false);
  }

  const navItems = isStaff
    ? [...NAV_ITEMS, { label: "Back office", view: "backoffice" as View }]
    : NAV_ITEMS;

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <button
          type="button"
          className="brand"
          onClick={() => go("overview")}
          aria-label="Hult International Business School home"
        >
          <span className="brand__mark" aria-hidden="true">
            HULT
          </span>
          <span className="brand__name">
            Hult International Business School
            <span className="brand__sub">Developer Program</span>
          </span>
        </button>

        <nav
          className={`navbar__nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              className={`navbar__link ${
                activeView === item.view ? "is-active" : ""
              }`}
              aria-current={activeView === item.view ? "page" : undefined}
              onClick={() => go(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="navbar__actions">
          <button
            type="button"
            className="navbar__search"
            onClick={onSearchClick}
            aria-label="Search"
          >
            <span aria-hidden="true">⌕</span>
            <span className="navbar__search-label">Search</span>
          </button>
          <ThemeToggle />
          {user ? (
            <div className="navbar__user">
              <span className="navbar__role" title={user.email}>
                {ROLE_LABELS[user.role]}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  void logout();
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onLoginClick}
            >
              Log In
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary navbar__cta"
            onClick={() => go("register")}
          >
            Register
          </button>
          <button
            type="button"
            className="navbar__burger"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
