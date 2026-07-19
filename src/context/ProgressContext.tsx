import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MILESTONES } from "../data/milestones";
import { FICTIONAL_PARTICIPANT_NAMES } from "../data/participants";

const FICTIONAL_NAME_SET = new Set(
  FICTIONAL_PARTICIPANT_NAMES.map((name) => name.trim().toLowerCase())
);

function isFictionalRegistrant(entry: Registrant): boolean {
  const full = `${entry.firstName} ${entry.lastName}`.trim().toLowerCase();
  return FICTIONAL_NAME_SET.has(full);
}

function sanitizeRegistrations(list: Registrant[]): Registrant[] {
  return list.filter((entry) => {
    if (!entry.email?.includes("@")) return false;
    if (isFictionalRegistrant(entry)) return false;
    return true;
  });
}

export interface Registrant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
  experience: string;
  primaryStack: string;
  emailVerified: boolean;
  verifyToken: string;
  registeredAt: string;
}

export type RegistrationInput = Omit<
  Registrant,
  "id" | "emailVerified" | "verifyToken" | "registeredAt"
>;

export interface Submission {
  week: string;
  reference: string;
  challenges: string;
  submittedAt: string;
}

type VoteTally = Record<string, Record<string, number>>;

interface ProgressContextValue {
  registrations: Registrant[];
  addRegistration: (data: RegistrationInput) => Registrant;
  ensureAuthRegistration: (input: {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }) => Registrant;
  isRegisteredEmail: (email: string) => boolean;
  verifyEmail: (token: string) => boolean;
  submissions: Record<string, Submission>;
  submitProject: (week: string, reference: string, challenges: string) => void;
  clearSubmission: (week: string) => void;
  votes: VoteTally;
  myVotes: Record<string, string>;
  castVote: (week: string, participant: string) => void;
  participants: string[];
  /** Bind the signed-in email so personal progress is user-specific. */
  setActiveUserEmail: (email: string | null) => void;
  activeUserEmail: string | null;
  registeredStep: boolean;
  submittedCount: number;
  totalSteps: number;
  completedSteps: number;
  percentComplete: number;
  /** Shared cohort progress (registration + weeks with cohort activity). */
  cohortRegisteredStep: boolean;
  cohortSubmittedCount: number;
  cohortCompletedSteps: number;
  cohortPercentComplete: number;
  cohortSize: number;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

const KEYS = {
  registrations: "ludwitt-registrations",
  submissions: "ludwitt-submissions",
  votes: "ludwitt-votes",
  myVotes: "ludwitt-my-votes",
  cohortWeeks: "ludwitt-cohort-weeks",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Registrant[]>(() =>
    sanitizeRegistrations(load<Registrant[]>(KEYS.registrations, []))
  );
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(
    () => load<Record<string, Submission>>(KEYS.submissions, {})
  );
  const [votes, setVotes] = useState<VoteTally>(() =>
    load<VoteTally>(KEYS.votes, {})
  );
  const [myVotes, setMyVotes] = useState<Record<string, string>>(() =>
    load<Record<string, string>>(KEYS.myVotes, {})
  );
  const [cohortWeeks, setCohortWeeks] = useState<string[]>(() =>
    load<string[]>(KEYS.cohortWeeks, [])
  );
  const myVotesRef = useRef(myVotes);
  useEffect(() => {
    myVotesRef.current = myVotes;
  }, [myVotes]);

  useEffect(() => {
    window.localStorage.setItem(
      KEYS.registrations,
      JSON.stringify(registrations)
    );
  }, [registrations]);
  useEffect(() => {
    window.localStorage.setItem(KEYS.submissions, JSON.stringify(submissions));
  }, [submissions]);
  useEffect(() => {
    window.localStorage.setItem(KEYS.votes, JSON.stringify(votes));
  }, [votes]);
  useEffect(() => {
    window.localStorage.setItem(KEYS.myVotes, JSON.stringify(myVotes));
  }, [myVotes]);
  useEffect(() => {
    window.localStorage.setItem(KEYS.cohortWeeks, JSON.stringify(cohortWeeks));
  }, [cohortWeeks]);

  const addRegistration = useCallback((data: RegistrationInput) => {
    const registrant: Registrant = {
      ...data,
      id: makeId(),
      emailVerified: false,
      verifyToken: makeId(),
      registeredAt: new Date().toISOString(),
    };
    setRegistrations((prev) => [...prev, registrant]);
    return registrant;
  }, []);

  const ensureAuthRegistration = useCallback(
    (input: {
      email: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    }) => {
      const email = input.email.trim().toLowerCase();
      let result: Registrant | undefined;
      setRegistrations((prev) => {
        const existing = prev.find((r) => r.email.toLowerCase() === email);
        if (existing) {
          result = existing;
          return prev;
        }
        const registrant: Registrant = {
          firstName: input.firstName?.trim() || "Participant",
          lastName: input.lastName?.trim() || "User",
          email,
          role: input.role || "Student",
          country: "",
          experience: "",
          primaryStack: "",
          id: makeId(),
          emailVerified: true,
          verifyToken: makeId(),
          registeredAt: new Date().toISOString(),
        };
        result = registrant;
        return [...prev, registrant];
      });
      return result!;
    },
    []
  );

  const isRegisteredEmail = useCallback(
    (email: string) =>
      registrations.some(
        (r) => r.email.toLowerCase() === email.trim().toLowerCase()
      ),
    [registrations]
  );

  const verifyEmail = useCallback((token: string) => {
    let found = false;
    setRegistrations((prev) =>
      prev.map((r) => {
        if (r.verifyToken === token) {
          found = true;
          return { ...r, emailVerified: true };
        }
        return r;
      })
    );
    return found;
  }, []);

  const submitProject = useCallback(
    (week: string, reference: string, challenges: string) => {
      setSubmissions((prev) => ({
        ...prev,
        [week]: {
          week,
          reference,
          challenges,
          submittedAt: new Date().toISOString(),
        },
      }));
      setCohortWeeks((prev) =>
        prev.includes(week) ? prev : [...prev, week]
      );
    },
    []
  );

  const clearSubmission = useCallback((week: string) => {
    setSubmissions((prev) => {
      const next = { ...prev };
      delete next[week];
      return next;
    });
  }, []);

  const castVote = useCallback((week: string, participant: string) => {
    if (!participant) return;
    // One vote per week (per device). Guard with a ref so we don't double-count
    // and so the state updaters below stay pure.
    if (myVotesRef.current[week]) return;
    myVotesRef.current = { ...myVotesRef.current, [week]: participant };
    setMyVotes(myVotesRef.current);
    setVotes((prevVotes) => {
      const weekTally = { ...(prevVotes[week] ?? {}) };
      weekTally[participant] = (weekTally[participant] ?? 0) + 1;
      return { ...prevVotes, [week]: weekTally };
    });
    setCohortWeeks((prev) =>
      prev.includes(week) ? prev : [...prev, week]
    );
  }, []);

  // Genuine registrants only — no seed/demo names in the cohort directory.
  const participants = useMemo(() => {
    const names = new Set<string>();
    registrations.forEach((r) => {
      if (isFictionalRegistrant(r)) return;
      names.add(`${r.firstName} ${r.lastName}`.trim());
    });
    return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  // Personal progress: current signed-in user registered + their submissions.
  const registeredStep = Boolean(
    activeUserEmail &&
      registrations.some(
        (r) => r.email.toLowerCase() === activeUserEmail.toLowerCase()
      )
  );
  const submittedCount = Object.keys(submissions).filter((week) =>
    MILESTONES.some((m) => m.week === week)
  ).length;
  const totalSteps = MILESTONES.length + 1;
  const completedSteps = (registeredStep ? 1 : 0) + submittedCount;
  const percentComplete = Math.round((completedSteps / totalSteps) * 100);

  const cohortSize = Math.max(registrations.length, 1);
  const cohortRegisteredStep = registrations.length > 0;
  const activeCohortWeeks = new Set<string>([
    ...cohortWeeks,
    ...Object.keys(submissions),
    ...Object.keys(votes).filter((week) =>
      Object.values(votes[week] ?? {}).some((count) => count > 0)
    ),
  ]);
  const cohortSubmittedCount = MILESTONES.filter((m) =>
    activeCohortWeeks.has(m.week)
  ).length;
  const cohortCompletedSteps =
    (cohortRegisteredStep ? 1 : 0) + cohortSubmittedCount;
  const cohortPercentComplete = Math.round(
    (cohortCompletedSteps / totalSteps) * 100
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      registrations,
      addRegistration,
      ensureAuthRegistration,
      isRegisteredEmail,
      verifyEmail,
      submissions,
      submitProject,
      clearSubmission,
      votes,
      myVotes,
      castVote,
      participants,
      setActiveUserEmail,
      activeUserEmail,
      registeredStep,
      submittedCount,
      totalSteps,
      completedSteps,
      percentComplete,
      cohortRegisteredStep,
      cohortSubmittedCount,
      cohortCompletedSteps,
      cohortPercentComplete,
      cohortSize,
    }),
    [
      registrations,
      addRegistration,
      ensureAuthRegistration,
      isRegisteredEmail,
      verifyEmail,
      submissions,
      submitProject,
      clearSubmission,
      votes,
      myVotes,
      castVote,
      participants,
      activeUserEmail,
      registeredStep,
      submittedCount,
      totalSteps,
      completedSteps,
      percentComplete,
      cohortRegisteredStep,
      cohortSubmittedCount,
      cohortCompletedSteps,
      cohortPercentComplete,
      cohortSize,
    ]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
