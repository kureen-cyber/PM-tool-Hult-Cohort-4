import { parseEmailList } from "../lib/firebase";

/**
 * Optional allowlist — left unused by default so any email can register/login.
 * Kept for staff who later want to lock signup to a roster via env.
 */
export const COHORT_EMAIL_ALLOWLIST: string[] = [];

export function getCohortAllowlist(): string[] {
  const fromEnv = parseEmailList(import.meta.env.VITE_COHORT_EMAILS);
  if (fromEnv.length > 0) return fromEnv;
  return COHORT_EMAIL_ALLOWLIST.map((e) => e.trim().toLowerCase()).filter(
    Boolean
  );
}

/** Always true unless a roster is explicitly configured (currently unused). */
export function isCohortParticipantEmail(_email: string): boolean {
  return true;
}
