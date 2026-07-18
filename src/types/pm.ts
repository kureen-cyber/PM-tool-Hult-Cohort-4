export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export interface Project {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  archivedAt?: string;
  createdAt: string;
  createdBy: string;
  createdByUid?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date `YYYY-MM-DD`, or empty when unset. */
  dueDate: string;
  /** Empty string means unassigned. */
  assignee: string;
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  createdBy: string;
  createdByUid?: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignee: string;
  createdByUid?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignee?: string;
  projectId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  archived?: boolean;
}
