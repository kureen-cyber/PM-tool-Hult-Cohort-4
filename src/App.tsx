import { useEffect, useState } from "react";
import { AuthProvider, ROLE_LABELS, useAuth } from "./context/AuthContext";
import { ProgressProvider, useProgress } from "./context/ProgressContext";
import { PmProvider } from "./context/PmContext";
import type { View } from "./navigation";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProjectsBoard from "./components/ProjectsBoard";
import PeerReview from "./components/PeerReview";
import ProgressTracker from "./components/ProgressTracker";
import BackOffice from "./components/BackOffice";
import Footer from "./components/Footer";
import MascotPopup from "./components/MascotPopup";
import CourseCalendar from "./components/CourseCalendar";
import CompletionCelebration from "./components/CompletionCelebration";
import CohortChat from "./components/CohortChat";
import SearchPanel from "./components/SearchPanel";
import Settings, {
  loadAppSettings,
  type AppSettings,
} from "./components/Settings";
import AiAssistant from "./components/AiAssistant";
import AuthLanding from "./components/AuthLanding";
import "./App.css";

function AuthBootScreen() {
  return (
    <div className="auth-boot" role="status" aria-live="polite">
      <span className="auth-boot__mark" aria-hidden="true">
        HULT
      </span>
      <p>Checking your session…</p>
    </div>
  );
}

function AppShell() {
  const { user, loading, isStaff } = useAuth();
  const { ensureAuthRegistration, setActiveUserEmail } = useProgress();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<View>("overview");
  const [appSettings, setAppSettings] = useState<AppSettings>(loadAppSettings);

  function navigate(next: View, query?: string) {
    setView(next);
    if (query !== undefined) setSearchQuery(query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!user) {
      setActiveUserEmail(null);
      return;
    }
    setActiveUserEmail(user.email);
    const [firstName, ...rest] = (user.displayName || "").trim().split(/\s+/);
    ensureAuthRegistration({
      email: user.email,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      role: ROLE_LABELS[user.role],
    });
  }, [ensureAuthRegistration, setActiveUserEmail, user]);

  useEffect(() => {
    if (view === "backoffice" && !isStaff) setView("overview");
  }, [view, isStaff]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (user) setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  useEffect(() => {
    function onSettings(e: Event) {
      const detail = (e as CustomEvent<AppSettings>).detail;
      if (detail) setAppSettings(detail);
    }
    window.addEventListener("hult-settings-changed", onSettings);
    return () => window.removeEventListener("hult-settings-changed", onSettings);
  }, []);

  if (loading) {
    return <AuthBootScreen />;
  }

  if (!user) {
    return <AuthLanding onAuthenticated={() => setView("overview")} />;
  }

  const showProgressTop =
    appSettings.showProgressBars &&
    (view === "overview" ||
      view === "peer-review" ||
      view === "projects" ||
      view === "chat");

  return (
    <div className="app">
      <Navbar
        activeView={view}
        onNavigate={navigate}
        onSearchClick={() => setSearchOpen(true)}
      />
      <main>
        {showProgressTop && <ProgressTracker />}
        {view === "overview" && (
          <>
            <Hero onNavigate={navigate} />
            <CourseCalendar />
          </>
        )}
        {view === "peer-review" && <PeerReview />}
        {view === "projects" && (
          <ProjectsBoard searchQuery={searchQuery} />
        )}
        {view === "chat" && <CohortChat />}
        {view === "settings" && <Settings />}
        {view === "backoffice" && isStaff && <BackOffice />}
      </main>
      <Footer activeView={view} onNavigate={navigate} />
      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />
      <AiAssistant />
      <MascotPopup />
      <CompletionCelebration />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <PmProvider>
          <AppShell />
        </PmProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
