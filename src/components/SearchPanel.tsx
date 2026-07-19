import { useEffect, useMemo, useRef, useState } from "react";
import { usePm } from "../context/PmContext";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../types/pm";
import type { View } from "../navigation";
import "./SearchPanel.css";

export interface SearchResult {
  id: string;
  kind: "page" | "project" | "task";
  title: string;
  subtitle: string;
  view: View;
}

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View, query?: string) => void;
}

const PAGE_ITEMS: SearchResult[] = [
  {
    id: "page-overview",
    kind: "page",
    title: "Overview",
    subtitle: "Hero and course calendar",
    view: "overview",
  },
  {
    id: "page-projects",
    kind: "page",
    title: "Projects",
    subtitle: "Create, edit, archive projects and tasks",
    view: "projects",
  },
  {
    id: "page-peer",
    kind: "page",
    title: "Peer Review",
    subtitle: "Technical feedback by week",
    view: "peer-review",
  },
  {
    id: "page-chat",
    kind: "page",
    title: "Chat",
    subtitle: "Cohort conversation",
    view: "chat",
  },
  {
    id: "page-settings",
    kind: "page",
    title: "Settings",
    subtitle: "Account, theme, AI assistant",
    view: "settings",
  },
];

export default function SearchPanel({
  open,
  onClose,
  onNavigate,
}: SearchPanelProps) {
  const { projects, tasks } = usePm();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResult[] = [
      ...PAGE_ITEMS,
      ...projects.map((p) => ({
        id: `proj-${p.id}`,
        kind: "project" as const,
        title: p.name,
        subtitle: p.archived
          ? "Archived project"
          : p.description || "Project",
        view: "projects" as View,
      })),
      ...tasks.map((t) => {
        const projectName =
          projects.find((p) => p.id === t.projectId)?.name ?? "Task";
        return {
          id: `task-${t.id}`,
          kind: "task" as const,
          title: t.title,
          subtitle: `${projectName} · ${TASK_STATUS_LABELS[t.status]} · ${TASK_PRIORITY_LABELS[t.priority]}`,
          view: "projects" as View,
        };
      }),
    ];

    if (!q) return items.slice(0, 8);

    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.kind.includes(q)
      )
      .slice(0, 12);
  }, [query, projects, tasks]);

  if (!open) return null;

  return (
    <div className="search-backdrop" role="presentation" onClick={onClose}>
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-panel__bar">
          <span className="search-panel__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            className="search-panel__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, projects, tasks…"
            aria-label="Search the app"
          />
          <button
            type="button"
            className="search-panel__close"
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </div>
        <ul className="search-panel__results">
          {results.length === 0 ? (
            <li className="search-panel__empty">No matches for “{query}”.</li>
          ) : (
            results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="search-panel__result"
                  onClick={() => {
                    onNavigate(item.view, query.trim() || item.title);
                    onClose();
                  }}
                >
                  <span className="search-panel__kind">{item.kind}</span>
                  <span className="search-panel__text">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
