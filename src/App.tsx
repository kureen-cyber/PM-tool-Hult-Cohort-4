import { useEffect, useState } from "react";
import { ProgressProvider } from "./context/ProgressContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PmProvider } from "./context/PmContext";
import type { View } from "./navigation";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProjectsBoard from "./components/ProjectsBoard";
import PeerReview from "./components/PeerReview";
import ProgressTracker, {
  ProgressSteps,
} from "./components/ProgressTracker";
import Registration from "./components/Registration";
import BackOffice from "./components/BackOffice";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import MascotPopup from "./components/MascotPopup";
import CourseCalendar from "./components/CourseCalendar";
import CompletionCelebration from "./components/CompletionCelebration";
import CohortChat from "./components/CohortChat";
import SearchPanel from "./components/SearchPanel";
import Settings, { loadAppSettings, type AppSettings } from "./components/Settings";
import AiAssistant from "./components/AiAssistant";
import "./App.css";

function AppShell() {
  const { isStaff } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
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
    if (view === "backoffice" && !isStaff) setView("overview");
  }, [view, isStaff]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onSettings(e: Event) {
      const detail = (e as CustomEvent<AppSettings>).detail;
      if (detail) setAppSettings(detail);
    }
    window.addEventListener("hult-settings-changed", onSettings);
    return () => window.removeEventListener("hult-settings-changed", onSettings);
  }, []);

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
        onLoginClick={() => setLoginOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
      />
      <main>
        {showProgressTop && <ProgressTracker />}
        {view === "overview" && (
          <>
            <Hero onNavigate={navigate} />
            <ProgressSteps />
            <CourseCalendar />
          </>
        )}
        {view === "peer-review" && (
          <>
            <ProgressSteps />
            <PeerReview />
          </>
        )}
        {view === "projects" && (
          <>
            <ProgressSteps />
            <ProjectsBoard searchQuery={searchQuery} />
          </>
        )}
        {view === "chat" && <CohortChat />}
        {view === "settings" && <Settings />}
        {view === "register" && <Registration />}
        {view === "backoffice" && isStaff && <BackOffice />}
      </main>
      <Footer activeView={view} onNavigate={navigate} />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onRegister={() => {
          setLoginOpen(false);
          navigate("register");
        }}
      />
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
