import { useEffect, useState } from "react";
import { ProgressProvider } from "./context/ProgressContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { View } from "./navigation";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Milestones from "./components/Milestones";
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
import "./App.css";

function AppShell() {
  const { isStaff } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [view, setView] = useState<View>("overview");

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // If a non-staff user lands on the back office (e.g. after logging out),
  // send them back to the overview.
  useEffect(() => {
    if (view === "backoffice" && !isStaff) setView("overview");
  }, [view, isStaff]);

  const showProgressTop =
    view === "overview" || view === "peer-review" || view === "milestones";

  return (
    <div className="app">
      <Navbar
        activeView={view}
        onNavigate={navigate}
        onLoginClick={() => setLoginOpen(true)}
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
        {view === "milestones" && (
          <>
            <ProgressSteps />
            <Milestones />
          </>
        )}
        {view === "chat" && <CohortChat />}
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
      <MascotPopup />
      <CompletionCelebration />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppShell />
      </ProgressProvider>
    </AuthProvider>
  );
}
