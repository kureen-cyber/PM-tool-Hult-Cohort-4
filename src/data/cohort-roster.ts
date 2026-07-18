import { parseEmailList } from "../lib/firebase";

/**
 * Optional hard allowlist of cohort participant emails.
 * Prefer env `VITE_COHORT_EMAILS` (comma-separated) so you never commit PII.
 * When empty, any Firebase-authenticated user with a real account may sign in
 * (registration still creates real Auth users).
 */
export const COHORT_EMAIL_ALLOWLIST: string[] = [];

export function getCohortAllowlist(): string[] {
  const fromEnv = parseEmailList(import.meta.env.VITE_COHORT_EMAILS);
  if (fromEnv.length > 0) return fromEnv;
  return COHORT_EMAIL_ALLOWLIST.map((e) => e.trim().toLowerCase()).filter(
    Boolean
  );
}

export function isCohortParticipantEmail(email: string): boolean {
  const allowlist = getCohortAllowlist();
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.trim().toLowerCase());
}
