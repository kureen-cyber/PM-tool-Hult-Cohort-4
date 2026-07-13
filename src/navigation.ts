export type View =
  | "overview"
  | "curriculum"
  | "milestones"
  | "register"
  | "backoffice";

// Primary tabs shown in the navbar for everyone. "Register" is reached via the
// navbar CTA / login modal, and "Back office" is added dynamically for staff.
export const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Overview", view: "overview" },
  { label: "Curriculum", view: "curriculum" },
  { label: "Milestones", view: "milestones" },
];
