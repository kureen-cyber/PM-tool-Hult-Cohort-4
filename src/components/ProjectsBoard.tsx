import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  filterTasks,
  formatDueDate,
  isOverdue,
  usePm,
} from "../context/PmContext";
import { useProgress } from "../context/ProgressContext";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from "../types/pm";
import "./ProjectsBoard.css";

interface ProjectsBoardProps {
  searchQuery?: string;
}

function projectProgress(tasksForProject: Task[]) {
  const total = tasksForProject.length;
  if (total === 0) {
    return { total: 0, done: 0, percent: 0 };
  }
  const done = tasksForProject.filter((t) => t.status === "done").length;
  return {
    total,
    done,
    percent: Math.round((done / total) * 100),
  };
}

export default function ProjectsBoard({
  searchQuery = "",
}: ProjectsBoardProps) {
  const { user } = useAuth();
  const { participants } = useProgress();
  const {
    projects,
    tasks,
    syncMode,
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
  } = usePm();

  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskError, setTaskError] = useState("");

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>([...assignees, ...participants]);
    if (user?.displayName) names.add(user.displayName);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [assignees, participants, user?.displayName]);

  const filteredTasks = useMemo(() => {
    const base = filterTasks(tasks, {
      projectId: projectFilter,
      status: statusFilter,
      assignee: assigneeFilter,
      priority: priorityFilter,
    }).filter((t) => {
      const project = projects.find((p) => p.id === t.projectId);
      if (!project) return true;
      return showArchived ? true : !project.archived;
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) => {
      const projectName =
        projects.find((p) => p.id === t.projectId)?.name ?? "";
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        projectName.toLowerCase().includes(q)
      );
    });
  }, [
    tasks,
    projectFilter,
    statusFilter,
    assigneeFilter,
    priorityFilter,
    searchQuery,
    projects,
    showArchived,
  ]);

  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (!showArchived && p.archived) return false;
      if (!q) return true;
      const taskHit = tasks.some(
        (t) =>
          t.projectId === p.id &&
          (t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.assignee.toLowerCase().includes(q))
      );
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        taskHit
      );
    });
  }, [projects, tasks, searchQuery, showArchived]);

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.archived),
    [projects]
  );

  const projectById = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p]));
    return map;
  }, [projects]);

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setBusy(true);
    try {
      const created = await createProject({
        name: projectName,
        description: projectDescription,
        createdBy: user?.displayName || user?.email || "Anonymous",
        createdByUid: user?.uid,
      });
      setProjectName("");
      setProjectDescription("");
      if (!taskProjectId) setTaskProjectId(created.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setTaskError("");
    const projectId = taskProjectId || activeProjects[0]?.id;
    if (!projectId) {
      setTaskError("Create a project before adding tasks.");
      return;
    }
    if (!taskTitle.trim()) {
      setTaskError("Task title is required.");
      return;
    }
    setBusy(true);
    try {
      await createTask({
        projectId,
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignee: taskAssignee,
        createdByUid: user?.uid,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskStatus("todo");
      setTaskPriority("medium");
      setTaskDueDate("");
      setTaskAssignee("");
    } finally {
      setBusy(false);
    }
  }

  const activeFilters =
    Boolean(projectFilter) ||
    Boolean(statusFilter) ||
    Boolean(assigneeFilter) ||
    Boolean(priorityFilter);

  return (
    <section className="section section-subtle projects-board">
      <div className="container">
        <div className="projects-board__head">
          <div>
            <span className="eyebrow">PM core</span>
            <h2 className="section-title">Projects &amp; tasks</h2>
            <p className="section-lead">
              Create projects and tasks with title, description, status, and
              assignee. Edit or archive projects anytime. Signed-in participants
              sync through Firebase so the board scales across the cohort.
            </p>
            {searchQuery.trim() && (
              <p className="pm-sync pm-sync--local">
                Filtering board for “{searchQuery.trim()}”
              </p>
            )}
            <p
              className={`pm-sync ${
                syncMode === "firestore" ? "pm-sync--cloud" : "pm-sync--local"
              }`}
            >
              {syncMode === "firestore"
                ? syncReady
                  ? "Synced with Firestore"
                  : "Connecting to Firestore…"
                : "Local mode — sign in with Firebase to sync across devices"}
              {syncError ? ` · ${syncError}` : ""}
            </p>
          </div>
          <div className="projects-board__stats" aria-label="Board counts">
            <div>
              <strong>{projects.length}</strong>
              <span>projects</span>
            </div>
            <div>
              <strong>{tasks.length}</strong>
              <span>tasks</span>
            </div>
            <div>
              <strong>{filteredTasks.length}</strong>
              <span>showing</span>
            </div>
          </div>
        </div>

        <div className="projects-board__forms">
          <form className="pm-card" onSubmit={handleCreateProject}>
            <h3 className="pm-card__title">New project</h3>
            <label className="pm-field">
              <span>Name</span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Cohort showcase site"
                required
              />
            </label>
            <label className="pm-field">
              <span>Description</span>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What is this project for?"
                rows={3}
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              Create project
            </button>
          </form>

          <form className="pm-card" onSubmit={handleCreateTask}>
            <h3 className="pm-card__title">New task</h3>
            <label className="pm-field">
              <span>Project</span>
              <select
                value={taskProjectId || activeProjects[0]?.id || ""}
                onChange={(e) => setTaskProjectId(e.target.value)}
                disabled={activeProjects.length === 0}
                required={activeProjects.length > 0}
              >
                {activeProjects.length === 0 ? (
                  <option value="">No active projects</option>
                ) : (
                  activeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="pm-field">
              <span>Title</span>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Draft acceptance criteria"
                required
              />
            </label>
            <label className="pm-field">
              <span>Description</span>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Details, acceptance notes, links…"
                rows={3}
              />
            </label>
            <div className="pm-field-row">
              <label className="pm-field">
                <span>Status</span>
                <select
                  value={taskStatus}
                  onChange={(e) =>
                    setTaskStatus(e.target.value as TaskStatus)
                  }
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pm-field">
                <span>Priority</span>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TaskPriority)
                  }
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="pm-field-row">
              <label className="pm-field">
                <span>Due date</span>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </label>
              <label className="pm-field">
                <span>Assignee</span>
                <input
                  list="pm-assignee-options"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  placeholder="Name or leave blank"
                />
              </label>
            </div>
            {taskError && <p className="pm-error">{taskError}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={activeProjects.length === 0 || busy}
            >
              Add task
            </button>
          </form>
        </div>

        <div className="pm-filters" role="group" aria-label="Task filters">
          <label className="pm-field pm-field--inline">
            <span>Project</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All projects</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="pm-field pm-field--inline">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TaskStatus | "")
              }
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="pm-field pm-field--inline">
            <span>Assignee</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="">Anyone</option>
              <option value="__unassigned__">Unassigned</option>
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="pm-field pm-field--inline">
            <span>Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as TaskPriority | "")
              }
            >
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="pm-check">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          {activeFilters && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setProjectFilter("");
                setStatusFilter("");
                setAssigneeFilter("");
                setPriorityFilter("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {visibleProjects.length > 0 && (
          <div className="pm-project-list">
            <h3 className="pm-subtitle">Projects</h3>
            <ul>
              {visibleProjects.map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const progress = projectProgress(projectTasks);
                const isEditing = editingProjectId === p.id;
                return (
                  <li
                    key={p.id}
                    className={`pm-project-chip ${
                      p.archived ? "pm-project-chip--archived" : ""
                    }`}
                  >
                    <div className="pm-project-chip__body">
                      {isEditing ? (
                        <div className="pm-edit-form">
                          <label className="pm-field">
                            <span>Name</span>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </label>
                          <label className="pm-field">
                            <span>Description</span>
                            <textarea
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              rows={2}
                            />
                          </label>
                          <div className="pm-edit-actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy || !editName.trim()}
                              onClick={() => {
                                void (async () => {
                                  setBusy(true);
                                  try {
                                    await updateProject(p.id, {
                                      name: editName,
                                      description: editDescription,
                                    });
                                    setEditingProjectId(null);
                                  } finally {
                                    setBusy(false);
                                  }
                                })();
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setEditingProjectId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <strong>
                            {p.name}
                            {p.archived ? " (archived)" : ""}
                          </strong>
                          {p.description && <p>{p.description}</p>}
                          <span>
                            {progress.done}/{progress.total} tasks done · by{" "}
                            {p.createdBy}
                          </span>
                          <div
                            className="pm-project-race"
                            aria-label={`${p.name} progress ${progress.percent}%`}
                          >
                            <div className="pm-project-race__track">
                              <div
                                className="pm-project-race__fill"
                                style={{ width: `${progress.percent}%` }}
                              />
                              <span
                                className="pm-project-race__runner"
                                style={{ left: `${progress.percent}%` }}
                                aria-hidden="true"
                              >
                                {progress.percent >= 100 ? "🏁" : "🚀"}
                              </span>
                            </div>
                            <span className="pm-project-race__pct">
                              {progress.total === 0
                                ? "No tasks"
                                : `${progress.percent}%`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="pm-project-chip__actions">
                      {!isEditing && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busy}
                          onClick={() => {
                            setEditingProjectId(p.id);
                            setEditName(p.name);
                            setEditDescription(p.description);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busy}
                        onClick={() => {
                          void (async () => {
                            setBusy(true);
                            try {
                              await archiveProject(p.id, !p.archived);
                            } finally {
                              setBusy(false);
                            }
                          })();
                        }}
                      >
                        {p.archived ? "Restore" : "Archive"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost pm-danger"
                        disabled={busy}
                        onClick={() => {
                          void (async () => {
                            if (
                              !window.confirm(
                                `Delete project “${p.name}” and its tasks?`
                              )
                            ) {
                              return;
                            }
                            setBusy(true);
                            try {
                              await deleteProject(p.id);
                              if (projectFilter === p.id) setProjectFilter("");
                              if (taskProjectId === p.id) setTaskProjectId("");
                            } finally {
                              setBusy(false);
                            }
                          })();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="pm-task-list">
          <h3 className="pm-subtitle">Tasks</h3>
          {filteredTasks.length === 0 ? (
            <p className="pm-empty">
              {tasks.length === 0
                ? "No tasks yet. Create a project, then add your first task."
                : "No tasks match the current filters."}
            </p>
          ) : (
            <ul>
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projectName={projectById.get(task.projectId)?.name ?? "—"}
                  projects={activeProjects.length > 0 ? activeProjects : projects}
                  busy={busy}
                  onUpdate={async (id, patch) => {
                    setBusy(true);
                    try {
                      await updateTask(id, patch);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  onDelete={async (id) => {
                    setBusy(true);
                    try {
                      await deleteTask(id);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <datalist id="pm-assignee-options">
          {assigneeOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>
    </section>
  );
}

interface TaskRowProps {
  task: Task;
  projectName: string;
  projects: { id: string; name: string }[];
  busy: boolean;
  onUpdate: (id: string, patch: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function TaskRow({
  task,
  projectName,
  projects,
  busy,
  onUpdate,
  onDelete,
}: TaskRowProps) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <li className={`pm-task pm-task--${task.status}`}>
      <div className="pm-task__main">
        <div className="pm-task__top">
          <span className={`pm-status pm-status--${task.status}`}>
            {TASK_STATUS_LABELS[task.status]}
          </span>
          <span className={`pm-priority pm-priority--${task.priority}`}>
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
          <span className="pm-task__project">{projectName}</span>
        </div>
        <h4 className="pm-task__title">{task.title}</h4>
        {task.description && (
          <p className="pm-task__desc">{task.description}</p>
        )}
        <p className="pm-task__meta">
          Assignee: {task.assignee || "Unassigned"}
          {" · "}
          <span className={overdue ? "pm-due--overdue" : undefined}>
            Due: {formatDueDate(task.dueDate)}
            {overdue ? " (overdue)" : ""}
          </span>
        </p>
      </div>
      <div className="pm-task__controls">
        <label className="pm-field pm-field--compact">
          <span>Status</span>
          <select
            value={task.status}
            disabled={busy}
            onChange={(e) =>
              void onUpdate(task.id, {
                status: e.target.value as TaskStatus,
              })
            }
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="pm-field pm-field--compact">
          <span>Priority</span>
          <select
            value={task.priority}
            disabled={busy}
            onChange={(e) =>
              void onUpdate(task.id, {
                priority: e.target.value as TaskPriority,
              })
            }
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="pm-field pm-field--compact">
          <span>Due date</span>
          <input
            type="date"
            value={task.dueDate}
            disabled={busy}
            onChange={(e) =>
              void onUpdate(task.id, { dueDate: e.target.value })
            }
          />
        </label>
        <label className="pm-field pm-field--compact">
          <span>Assignee</span>
          <input
            list="pm-assignee-options"
            value={task.assignee}
            disabled={busy}
            onChange={(e) =>
              void onUpdate(task.id, { assignee: e.target.value })
            }
            placeholder="Unassigned"
          />
        </label>
        <label className="pm-field pm-field--compact">
          <span>Project</span>
          <select
            value={task.projectId}
            disabled={busy}
            onChange={(e) =>
              void onUpdate(task.id, { projectId: e.target.value })
            }
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-ghost pm-danger"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Delete task “${task.title}”?`)) {
              void onDelete(task.id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
