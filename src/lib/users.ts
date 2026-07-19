import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db, resolveAuthRole } from "./firebase";
import type { Role } from "../context/AuthContext";

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  programRole: string;
  country?: string;
  experience?: string;
  primaryStack?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DirectoryUser {
  uid: string;
  email: string;
  name: string;
  role: string;
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "role" | "createdAt" | "updatedAt"> & {
    role?: Role;
  }
): Promise<UserProfile> {
  if (!db) throw new Error("Firestore is not configured.");

  const role = data.role ?? resolveAuthRole(data.email);
  const profile: UserProfile = {
    email: data.email.trim().toLowerCase(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    role,
    programRole: data.programRole || "Student",
    country: data.country?.trim() || "",
    experience: data.experience || "",
    primaryStack: data.primaryStack?.trim() || "",
  };

  await setDoc(doc(db, "users", uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function touchUserProfile(uid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, "users", uid), { updatedAt: serverTimestamp() });
}

/** Live cohort directory from Firestore `users` (genuine registered accounts). */
export function subscribeUserDirectory(
  onChange: (people: DirectoryUser[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  if (!db) {
    onChange([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(db, "users"),
    (snap) => {
      const people = snap.docs
        .map((entry) => {
          const data = entry.data() as UserProfile;
          const email = (data.email || "").trim().toLowerCase();
          if (!email.includes("@")) return null;
          const name =
            `${data.firstName || ""} ${data.lastName || ""}`.trim() || email;
          return {
            uid: entry.id,
            email,
            name,
            role: data.programRole || data.role || "Student",
          };
        })
        .filter((person): person is DirectoryUser => person !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
      onChange(people);
    },
    (err) => {
      onError?.(err.message);
      onChange([]);
    }
  );
}
