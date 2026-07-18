import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { isFirebaseConfigured } from "../lib/firebase";
import {
  deleteProjectDoc,
  deleteTaskDoc,
  subscribeProjects,
  subscribeTasks,
  upsertProjectDoc,
  upsertTaskDoc,
} from "../lib/pm";
import type {
  CreateProjectInput,
  CreateTaskInput,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateProjectInput,
  UpdateTaskInput,
} from "../types/pm";
import { PRIORITY_RANK } from "../types/pm";

interface PmContextValue {
  projects: Project[];
  tasks: Task[];
  syncMode: "local" | "firestore";
  syncReady: boolean;
  syncError: string | null;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, patch: UpdateProjectInput) => Promise<void>;
  archiveProject: (id: string, archived?: boolean) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignees: string[];
}

const PmContext = createContext<PmContextValue | undefined>(undefined);

const KEYS = {
  projects: "hult-pm-projects",
  tasks: "hult-pm-tasks",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    archived: Boolean(project.archived),
  };
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    priority: task.priority ?? "medium",
    dueDate: task.dueDate ?? "",
  };
}

export function PmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const useCloud = Boolean(isFirebaseConfigured && user);

  const [projects, setProjects] = useState<Project[]>(() =>
    load<Project[]>(KEYS.projects, []).map(normalizeProject)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    load<Task[]>(KEYS.tasks, []).map(normalizeTask)
  );
  const [syncReady, setSyncReady] = useState(!useCloud);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!useCloud) {
      setSyncReady(true);
      setSyncError(null);
      setProjects(load<Project[]>(KEYS.projects, []).map(normalizeProject));
      setTasks(load<Task[]>(KEYS.tasks, []).map(normalizeTask));
      return;
    }

    setSyncReady(false);
    setSyncError(null);
    let projectsReady = false;
    let tasksReady = false;

    const markReady = () => {
      if (projectsReady && tasksReady) setSyncReady(true);
    };

    const unsubProjects = subscribeProjects(
      (next) => {
        setProjects(next.map(normalizeProject));
        projectsReady = true;
        markReady();
      },
      (err) => {
        setSyncError(err.message);
        setSyncReady(true);
      }
    );

    const unsubTasks = subscribeTasks(
      (next) => {
        setTasks(next.map(normalizeTask));
        tasksReady = true;
        markReady();
      },
      (err) => {
        setSyncError(err.message);
        setSyncReady(true);
      }
    );

    return () => {
      unsubProjects?.();
      unsubTasks?.();
    };
  }, [useCloud]);

  const persistLocalProjects = useCallback((next: Project[]) => {
    setProjects(next);
    save(KEYS.projects, next);
  }, []);

  const persistLocalTasks = useCallback((next: Task[]) => {
    setTasks(next);
    save(KEYS.tasks, next);
  }, []);

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      const now = new Date().toISOString();
      const project: Project = {
        id: makeId("proj"),
        name: input.name.trim(),
        description: input.description.trim(),
        archived: false,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy.trim() || "Anonymous",
        createdByUid: input.createdByUid || user?.uid,
      };
      if (useCloud) {
        await upsertProjectDoc(project);
      } else {
        persistLocalProjects([project, ...projects]);
      }
      return project;
    },
    [persistLocalProjects, projects, useCloud, user?.uid]
  );

  const updateProject = useCallback(
    async (id: string, patch: UpdateProjectInput) => {
      const current = projects.find((p) => p.id === id);
      if (!current) return;
      const next: Project = {
        ...current,
        name: patch.name?.trim() ?? current.name,
        description: patch.description?.trim() ?? current.description,
        archived: patch.archived ?? current.archived,
        archivedAt:
          patch.archived === true
            ? new Date().toISOString()
            : patch.archived === false
              ? undefined
              : current.archivedAt,
        updatedAt: new Date().toISOString(),
      };
      if (useCloud) {
        await upsertProjectDoc(next);
      } else {
        persistLocalProjects(projects.map((p) => (p.id === id ? next : p)));
      }
    },
    [persistLocalProjects, projects, useCloud]
  );

  const archiveProject = useCallback(
    async (id: string, archived = true) => {
      await updateProject(id, { archived });
    },
    [updateProject]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const related = tasks.filter((t) => t.projectId === id);
      if (useCloud) {
        await Promise.all([
          deleteProjectDoc(id),
          ...related.map((t) => deleteTaskDoc(t.id)),
        ]);
      } else {
        persistLocalProjects(projects.filter((p) => p.id !== id));
        persistLocalTasks(tasks.filter((t) => t.projectId !== id));
      }
    },
    [persistLocalProjects, persistLocalTasks, projects, tasks, useCloud]
  );

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      const now = new Date().toISOString();
      const task: Task = {
        id: makeId("task"),
        projectId: input.projectId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        priority: input.priority ?? "medium",
        dueDate: (input.dueDate ?? "").trim(),
        assignee: input.assignee.trim(),
        createdAt: now,
        updatedAt: now,
        createdByUid: input.createdByUid || user?.uid,
      };
      if (useCloud) {
        await upsertTaskDoc(task);
      } else {
        persistLocalTasks([task, ...tasks]);
      }
      return task;
    },
    [persistLocalTasks, tasks, useCloud, user?.uid]
  );

  const updateTask = useCallback(
    async (id: string, patch: UpdateTaskInput) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;
      const next: Task = {
        ...current,
        title: patch.title?.trim() ?? current.title,
        description: patch.description?.trim() ?? current.description,
        status: patch.status ?? current.status,
        priority: patch.priority ?? current.priority,
        dueDate:
          patch.dueDate !== undefined ? patch.dueDate.trim() : current.dueDate,
        assignee:
          patch.assignee !== undefined
            ? patch.assignee.trim()
            : current.assignee,
        projectId: patch.projectId ?? current.projectId,
        updatedAt: new Date().toISOString(),
      };
      if (useCloud) {
        await upsertTaskDoc(next);
      } else {
        persistLocalTasks(tasks.map((t) => (t.id === id ? next : t)));
      }
    },
    [persistLocalTasks, tasks, useCloud]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (useCloud) {
        await deleteTaskDoc(id);
      } else {
        persistLocalTasks(tasks.filter((t) => t.id !== id));
      }
    },
    [persistLocalTasks, tasks, useCloud]
  );

  const assignees = useMemo(() => {
    const names = new Set<string>();
    for (const t of tasks) {
      if (t.assignee) names.add(t.assignee);
    }
    for (const p of projects) {
      if (p.createdBy) names.add(p.createdBy);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tasks, projects]);

  const value = useMemo(
    () => ({
      projects,
      tasks,
      syncMode: useCloud ? ("firestore" as const) : ("local" as const),
      syncReady,
      syncError,
      createProject,
      updateProject,
      archiveProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      assignees,
    }),
    [
      projects,
      tasks,
      useCloud,
      syncReady,
      syncError,
      createProject,
      updateProject,
      archiveProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      assignees,
    ]
  );

  return <PmContext.Provider value={value}>{children}</PmContext.Provider>;
}

export function usePm() {
  const ctx = useContext(PmContext);
  if (!ctx) throw new Error("usePm must be used within PmProvider");
  return ctx;
}

export function filterTasks(
  tasks: Task[],
  filters: {
    projectId: string;
    status: TaskStatus | "";
    assignee: string;
    priority: TaskPriority | "";
  }
): Task[] {
  const filtered = tasks.filter((t) => {
    if (filters.projectId && t.projectId !== filters.projectId) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee === "__unassigned__") return !t.assignee;
    if (filters.assignee && t.assignee !== filters.assignee) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function formatDueDate(dueDate: string): string {
  if (!dueDate) return "No due date";
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due < today;
}
