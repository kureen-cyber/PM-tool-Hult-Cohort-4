export type View =
  | "overview"
  | "projects"
  | "peer-review"
  | "chat"
  | "settings"
  | "register"
  | "backoffice";

// Primary tabs shown in the navbar for everyone. "Register" is reached via the
// navbar CTA / login modal, and "Back office" is added dynamically for staff.
export const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Overview", view: "overview" },
  { label: "Projects", view: "projects" },
  { label: "Peer Review", view: "peer-review" },
  { label: "Chat", view: "chat" },
  { label: "Settings", view: "settings" },
];
