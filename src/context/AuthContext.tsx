import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured, resolveAuthRole } from "../lib/firebase";
import {
  createUserProfile,
  getUserProfile,
  type UserProfile,
} from "../lib/users";
import { isCohortParticipantEmail } from "../data/cohort-roster";

export type Role = "student" | "professor" | "admin";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  programRole: string;
  country?: string;
  experience?: string;
  primaryStack?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  firebaseEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  professor: "Professor",
  admin: "Site admin",
};

function mapFirebaseUser(user: User, profile: UserProfile | null): AuthUser {
  const role = profile?.role ?? resolveAuthRole(user.email ?? "");
  return {
    uid: user.uid,
    email: user.email ?? profile?.email ?? "",
    displayName:
      user.displayName ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      user.email ||
      "User",
    role,
    emailVerified: user.emailVerified,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(mapFirebaseUser(firebaseUser, profile));
      } catch {
        setUser(mapFirebaseUser(firebaseUser, null));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Real participant login requires Firebase. Add VITE_FIREBASE_* values to .env.local."
      );
    }
    const normalized = email.trim().toLowerCase();
    if (!isCohortParticipantEmail(normalized)) {
      throw new Error(
        "This email is not on the cohort participant roster. Contact your professor if you believe this is an error."
      );
    }
    const credential = await signInWithEmailAndPassword(
      auth,
      normalized,
      password
    );
    const profile = await getUserProfile(credential.user.uid);
    if (!profile) {
      await signOut(auth);
      throw new Error(
        "No participant profile found for this account. Register with your cohort email first."
      );
    }
    setUser(mapFirebaseUser(credential.user, profile));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Registration requires Firebase. Add VITE_FIREBASE_* values to .env.local."
      );
    }

    const email = input.email.trim().toLowerCase();
    if (!isCohortParticipantEmail(email)) {
      throw new Error(
        "Only rostered cohort participant emails can register. Ask staff to add your email."
      );
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      input.password
    );

    const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
    await updateProfile(credential.user, { displayName });

    const role = resolveAuthRole(email);
    const profile = await createUserProfile(credential.user.uid, {
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      programRole: input.programRole,
      country: input.country,
      experience: input.experience,
      primaryStack: input.primaryStack,
      role,
    });

    await sendEmailVerification(credential.user);

    const mapped = mapFirebaseUser(credential.user, profile);
    setUser(mapped);
    return mapped;
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
  }, []);

  const refreshEmailVerification = useCallback(async () => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    const profile = await getUserProfile(auth.currentUser.uid);
    const mapped = mapFirebaseUser(auth.currentUser, profile);
    setUser(mapped);
    return mapped.emailVerified;
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) {
      throw new Error("You must be signed in to resend verification.");
    }
    await sendEmailVerification(auth.currentUser);
  }, []);

  const isStaff = user?.role === "professor" || user?.role === "admin";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseEnabled: isFirebaseConfigured,
      login,
      register,
      logout,
      refreshEmailVerification,
      resendVerificationEmail,
      isStaff,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      refreshEmailVerification,
      resendVerificationEmail,
      isStaff,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
