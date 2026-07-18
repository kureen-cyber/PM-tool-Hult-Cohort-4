import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePm } from "../context/PmContext";
import { useAuth } from "../context/AuthContext";
import { TASK_STATUS_LABELS } from "../types/pm";
import { loadAppSettings, type AppSettings } from "./Settings";
import "./AiAssistant.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildLocalReply(
  prompt: string,
  ctx: {
    displayName: string;
    projectCount: number;
    openTasks: { title: string; status: string; assignee: string; project: string }[];
    overdueCount: number;
  }
): string {
  const q = prompt.toLowerCase();
  const open = ctx.openTasks;

  if (/hello|hi\b|hey/.test(q)) {
    return `Hi ${ctx.displayName}! I can help with projects and tasks — ask what to work on next, how to filter the board, or how to archive a project.`;
  }

  if (/next|what should|priorit|focus/.test(q)) {
    if (open.length === 0) {
      return "You have no open tasks. Create a project under Projects, then add a task with a title, description, status, and assignee.";
    }
    const top = open.slice(0, 3)
      .map(
        (t, i) =>
          `${i + 1}. “${t.title}” (${TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}) in ${t.project}${t.assignee ? ` · ${t.assignee}` : ""}`
      )
      .join("\n");
    return `Suggested focus (${ctx.projectCount} projects, ${open.length} open tasks${ctx.overdueCount ? `, ${ctx.overdueCount} overdue` : ""}):\n${top}\n\nTip: filter by assignee or status on the Projects tab to narrow the board.`;
  }

  if (/archive/.test(q)) {
    return "On the Projects tab, open a project card and click Archive. Use “Show archived” in the filters to restore later. Archived projects stay out of the active task list.";
  }

  if (/filter|assignee|status/.test(q)) {
    return "Use the filter row on Projects: Project, Status (To do / In progress / Done), and Assignee. Combine them to see only your lane of work.";
  }

  if (/create|new task|add task/.test(q)) {
    return "Create or pick a project, then fill New task: title, description, status (≥3 states), and assignee. Signed-in participants sync to Firestore so the whole cohort can collaborate.";
  }

  if (/login|auth|firebase|sign in/.test(q)) {
    return "Sign in with your real cohort email and password (Firebase Auth). Demo login is disabled. Staff can optionally set VITE_COHORT_EMAILS to restrict who may register.";
  }

  return `I can help with PM workflows on this board. You currently have ${ctx.projectCount} project(s) and ${open.length} open task(s). Try asking: “What should I work on next?”, “How do I archive a project?”, or “How do filters work?”`;
}

async function maybeCallOpenAI(
  prompt: string,
  system: string
): Promise<string | null> {
  const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export default function AiAssistant() {
  const { user } = useAuth();
  const { projects, tasks } = usePm();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi — I’m your PM assistant. Ask about next tasks, filters, archiving, or cohort auth.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onSettings(e: Event) {
      const detail = (e as CustomEvent<AppSettings>).detail;
      if (detail) setSettings(detail);
    }
    window.addEventListener("hult-settings-changed", onSettings);
    return () => window.removeEventListener("hult-settings-changed", onSettings);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const context = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.archived);
    const openTasks = tasks
      .filter((t) => {
        if (t.status === "done") return false;
        const p = projects.find((x) => x.id === t.projectId);
        return p ? !p.archived : true;
      })
      .map((t) => ({
        title: t.title,
        status: t.status,
        assignee: t.assignee,
        project:
          projects.find((p) => p.id === t.projectId)?.name ?? "Unknown",
        dueDate: t.dueDate,
      }));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueCount = openTasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(`${t.dueDate}T00:00:00`) < today;
    }).length;
    return {
      displayName: user?.displayName || "there",
      projectCount: activeProjects.length,
      openTasks,
      overdueCount,
    };
  }, [projects, tasks, user?.displayName]);

  if (!settings.aiAssistantEnabled) return null;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || busy) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", text: prompt },
    ]);
    setBusy(true);
    try {
      const system = `You are a concise PM assistant for a Hult cohort project tool. User: ${context.displayName}. Active projects: ${context.projectCount}. Open tasks: ${JSON.stringify(context.openTasks.slice(0, 12))}. Prefer short actionable answers about tasks, filters, archive, and Firebase participant auth.`;
      const cloud = await maybeCallOpenAI(prompt, system);
      const text = cloud ?? buildLocalReply(prompt, context);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", text },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-assistant">
      {open && (
        <div className="ai-assistant__panel" role="dialog" aria-label="AI assistant">
          <header className="ai-assistant__head">
            <div>
              <strong>PM assistant</strong>
              <span>Tasks · filters · archive help</span>
            </div>
            <button
              type="button"
              className="ai-assistant__close"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </header>
          <div className="ai-assistant__messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-bubble ai-bubble--${m.role}`}
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="ai-assistant__form" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your tasks…"
              aria-label="Message the assistant"
              disabled={busy}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !input.trim()}
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="ai-assistant__fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open AI assistant"
      >
        AI
      </button>
    </div>
  );
}
