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
import { SEED_PARTICIPANTS } from "../data/participants";

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
  verifyEmail: (token: string) => boolean;
  submissions: Record<string, Submission>;
  submitProject: (week: string, reference: string, challenges: string) => void;
  clearSubmission: (week: string) => void;
  votes: VoteTally;
  myVotes: Record<string, string>;
  castVote: (week: string, participant: string) => void;
  participants: string[];
  registeredStep: boolean;
  submittedCount: number;
  totalSteps: number;
  completedSteps: number;
  percentComplete: number;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined
);

const KEYS = {
  registrations: "ludwitt-registrations",
  submissions: "ludwitt-submissions",
  votes: "ludwitt-votes",
  myVotes: "ludwitt-my-votes",
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
    load<Registrant[]>(KEYS.registrations, [])
  );
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(
    () => load<Record<string, Submission>>(KEYS.submissions, {})
  );
  const [votes, setVotes] = useState<VoteTally>(() =>
    load<VoteTally>(KEYS.votes, {})
  );
  const [myVotes, setMyVotes] = useState<Record<string, string>>(() =>
    load<Record<string, string>>(KEYS.myVotes, {})
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
  }, []);

  const participants = useMemo(() => {
    const names = new Set<string>(SEED_PARTICIPANTS);
    registrations.forEach((r) =>
      names.add(`${r.firstName} ${r.lastName}`.trim())
    );
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  const registeredStep = registrations.length > 0;
  const submittedCount = Object.keys(submissions).filter((week) =>
    MILESTONES.some((m) => m.week === week)
  ).length;
  const totalSteps = MILESTONES.length + 1;
  const completedSteps = (registeredStep ? 1 : 0) + submittedCount;
  const percentComplete = Math.round((completedSteps / totalSteps) * 100);

  const value = useMemo<ProgressContextValue>(
    () => ({
      registrations,
      addRegistration,
      verifyEmail,
      submissions,
      submitProject,
      clearSubmission,
      votes,
      myVotes,
      castVote,
      participants,
      registeredStep,
      submittedCount,
      totalSteps,
      completedSteps,
      percentComplete,
    }),
    [
      registrations,
      addRegistration,
      verifyEmail,
      submissions,
      submitProject,
      clearSubmission,
      votes,
      myVotes,
      castVote,
      participants,
      registeredStep,
      submittedCount,
      totalSteps,
      completedSteps,
      percentComplete,
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
