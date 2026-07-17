import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
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
