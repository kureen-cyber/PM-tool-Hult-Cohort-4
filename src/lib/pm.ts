import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Project, Task, TaskPriority, TaskStatus } from "../types/pm";
import { TASK_PRIORITIES, TASK_STATUSES } from "../types/pm";

export const PM_PROJECTS_COLLECTION = "pmProjects";
export const PM_TASKS_COLLECTION = "pmTasks";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStatus(value: unknown): TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "todo";
}

function asPriority(value: unknown): TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority)
    ? (value as TaskPriority)
    : "medium";
}

export function projectFromDoc(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: asString(data.name),
    description: asString(data.description),
    archived: Boolean(data.archived),
    archivedAt: asString(data.archivedAt) || undefined,
    createdAt: asString(data.createdAt, new Date().toISOString()),
    createdBy: asString(data.createdBy, "Anonymous"),
    createdByUid: asString(data.createdByUid) || undefined,
    updatedAt: asString(data.updatedAt) || undefined,
  };
}

export function taskFromDoc(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    projectId: asString(data.projectId),
    title: asString(data.title),
    description: asString(data.description),
    status: asStatus(data.status),
    priority: asPriority(data.priority),
    dueDate: asString(data.dueDate),
    assignee: asString(data.assignee),
    createdAt: asString(data.createdAt, new Date().toISOString()),
    updatedAt: asString(data.updatedAt, new Date().toISOString()),
    createdByUid: asString(data.createdByUid) || undefined,
  };
}

export function subscribeProjects(
  onData: (projects: Project[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(
    collection(db, PM_PROJECTS_COLLECTION),
    (snap) => {
      const projects = snap.docs.map((d) =>
        projectFromDoc(d.id, d.data() as Record<string, unknown>)
      );
      projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(projects);
    },
    (err) => onError?.(err)
  );
}

export function subscribeTasks(
  onData: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(
    collection(db, PM_TASKS_COLLECTION),
    (snap) => {
      const tasks = snap.docs.map((d) =>
        taskFromDoc(d.id, d.data() as Record<string, unknown>)
      );
      tasks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(tasks);
    },
    (err) => onError?.(err)
  );
}

export async function upsertProjectDoc(project: Project): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  const { id, ...rest } = project;
  await setDoc(doc(db, PM_PROJECTS_COLLECTION, id), rest, { merge: true });
}

export async function deleteProjectDoc(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, PM_PROJECTS_COLLECTION, id));
}

export async function upsertTaskDoc(task: Task): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  const { id, ...rest } = task;
  await setDoc(doc(db, PM_TASKS_COLLECTION, id), rest, { merge: true });
}

export async function deleteTaskDoc(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, PM_TASKS_COLLECTION, id));
}
