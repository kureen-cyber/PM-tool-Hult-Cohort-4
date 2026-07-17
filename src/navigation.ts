export type View =
  | "overview"
  | "peer-review"
  | "chat"
  | "milestones"
  | "register"
  | "backoffice";

// Primary tabs shown in the navbar for everyone. "Register" is reached via the
// navbar CTA / login modal, and "Back office" is added dynamically for staff.
export const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Overview", view: "overview" },
  { label: "Milestones", view: "milestones" },
  { label: "Peer Review", view: "peer-review" },
  { label: "Chat", view: "chat" },
];
