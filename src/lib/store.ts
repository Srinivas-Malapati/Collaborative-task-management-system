import { EventEmitter } from "events";
import type { Comment, Project, ProjectEvent, Task, TaskStatus } from "./types";

import { PROJECTS as MOCK_PROJECTS } from "./data";

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(100);

type UpdateResult =
  | { ok: true; task: Task }
  | { ok: false; error: string; task: Task | null };

// Initialize from MOCK_PROJECTS to ensure data consistency
const initialProjects: Project[] = MOCK_PROJECTS.map(p => ({
  ...p,
  tasks: [] // Store keeps tasks flat in TASKS array
}));

const initialTasks: Task[] = MOCK_PROJECTS.flatMap(p => p.tasks);

const initialComments: Comment[] = [
  {
    id: "c1",
    taskId: "t2",
    content: "We should pick matte finish.",
    author: "Alex",
    timestamp: new Date().toISOString()
  }
];

const initialEvents: ProjectEvent[] = [
  {
    id: "e1",
    projectId: "p1",
    type: "other",
    message: "Project created",
    timestamp: new Date().toISOString()
  }
];

// --- HMR-safe Persistent Store ---

declare global {
  var __PROJECTS: Project[];
  var __TASKS: Task[];
  var __COMMENTS: Comment[];
  var __EVENTS: ProjectEvent[];
}

if (!globalThis.__PROJECTS) {
  globalThis.__PROJECTS = structuredClone(initialProjects);
  globalThis.__TASKS = structuredClone(initialTasks);
  globalThis.__COMMENTS = structuredClone(initialComments);
  globalThis.__EVENTS = structuredClone(initialEvents);
}

// Helper to access globals (mutable)
const getProjects = () => globalThis.__PROJECTS;
const getTasks = () => globalThis.__TASKS;
const getComments = () => globalThis.__COMMENTS;
const getEvents = () => globalThis.__EVENTS;

function nowIso() {
  return new Date().toISOString();
}

function depsAreDone(task: Task) {
  return task.dependencies.every((depId) => {
    const dep = getTasks().find((t) => t.id === depId);
    return dep?.status === "done";
  });
}

/** --- Public API --- **/

export function resetStore() {
  globalThis.__PROJECTS = structuredClone(initialProjects);
  globalThis.__TASKS = structuredClone(initialTasks);
  globalThis.__COMMENTS = structuredClone(initialComments);
  globalThis.__EVENTS = structuredClone(initialEvents);
}

export function listProjects() {
  return getProjects().map(p => ({
    ...p,
    tasks: getTasksByProject(p.id)
  }));
}

export function getProject(projectId: string) {
  const p = getProjects().find((p) => p.id === projectId);
  if (!p) return null;
  return { ...p, tasks: getTasksByProject(projectId) };
}

export function getTasksByProject(projectId: string) {
  return getTasks().filter((t) => t.projectId === projectId);
}

export function createTask(
  projectId: string,
  title: string,
  description: string,
  assignedTo: string[] = [],
  priority: "low" | "medium" | "high" = "medium",
  dependencies: string[] = []
): Task {
  const id = `t${getTasks().length + 1}`;
  const newTask: Task = {
    id,
    projectId,
    title,
    description,
    status: "todo",
    assignedTo,
    configuration: { priority },
    dependencies,
  };

  getTasks().push(newTask);
  addProjectEvent(projectId, "task_add", `New task created: "${title}"`);
  notifyListeners(projectId, "task_add", newTask);

  return newTask;
}

export function updateTaskStatus(taskId: string, next: TaskStatus): UpdateResult {
  const idx = getTasks().findIndex((t) => t.id === taskId);
  if (idx === -1) return { ok: false, error: "Task not found", task: null };

  const current = getTasks()[idx];
  const previousStatus = current.status;

  // ✅ Rule: can always move to TODO
  if (next === "todo") {
    getTasks()[idx] = { ...current, status: "todo" };
    addProjectEvent(
      current.projectId,
      "task_update",
      `Task "${current.title}" moved to TODO`,
      { taskId: current.id, field: "status", previousValue: previousStatus, newValue: "todo" }
    );
    notifyListeners(current.projectId, "task_update", getTasks()[idx]);
    return { ok: true, task: getTasks()[idx] };
  }

  // ✅ Rule: to move to IN_PROGRESS or DONE, deps must be DONE
  if (!depsAreDone(current)) {
    return {
      ok: false,
      error: `Blocked: dependencies not DONE (${current.dependencies.join(", ")})`,
      task: current
    };
  }

  getTasks()[idx] = { ...current, status: next };
  addProjectEvent(
    current.projectId,
    "task_update",
    `Task "${current.title}" moved to ${next}`,
    { taskId: current.id, field: "status", previousValue: previousStatus, newValue: next }
  );
  notifyListeners(current.projectId, "task_update", getTasks()[idx]);
  return { ok: true, task: getTasks()[idx] };
}

export function listComments(taskId: string) {
  return getComments().filter((c) => c.taskId === taskId).sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
}

export function addComment(taskId: string, content: string, author: string) {
  const id = `c${getComments().length + 1}`;
  const comment: Comment = { id, taskId, content, author, timestamp: nowIso() };
  getComments().push(comment);

  const task = getTasks().find((t) => t.id === taskId);
  if (task) {
    addProjectEvent(task.projectId, "comment_add", `New comment on "${task.title}"`);
    notifyListeners(task.projectId, "comment_add", comment);
  }

  return comment;
}

export function listProjectEvents(projectId: string) {
  return getEvents().filter((e) => e.projectId === projectId).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}

export function addProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  message: string,
  data?: ProjectEvent["data"]
) {
  const id = `e${getEvents().length + 1}`;
  const evt: ProjectEvent = { id, projectId, type, message, timestamp: nowIso(), data };
  getEvents().push(evt);
  return evt;
}

export function undoLastAction(projectId: string): { ok: boolean; message: string } {
  // Find last event that has 'data' (reversible)
  // Iterate backwards
  for (let i = getEvents().length - 1; i >= 0; i--) {
    const evt = getEvents()[i];
    if (evt.projectId === projectId && evt.data && evt.data.previousValue !== undefined && !evt.reverted) {

      // Perform revert
      if (evt.type === "task_update" && evt.data.taskId && evt.data.field === "status") {
        const taskIdx = getTasks().findIndex(t => t.id === evt.data!.taskId);
        if (taskIdx === -1) continue;

        const prevStatus = evt.data.previousValue as TaskStatus;
        getTasks()[taskIdx] = { ...getTasks()[taskIdx], status: prevStatus }; // Set back to old status

        // Mark as reverted
        getEvents()[i].reverted = true;

        // Remove the event (or add an 'undo' event to history? for now, let's just log a new undo event and keep history linear)
        // Ideally we append a NEW event "Undid action..."
        addProjectEvent(projectId, "other", `Undid: ${evt.message}`);

        notifyListeners(projectId, "task_update", getTasks()[taskIdx]);

        // Remove the original event from being "undoable" again? 
        // A simple way is to delete it, but that destroys history.
        // Better: Mark it as reverted. But for this MVP, popping it or just ignoring it is complex.
        // Simplest: Just append the inverse operation.

        // WAIT: If we just append the inverse, then the NEXT undo will undo the UNDO. That is actually correct behavior!
        // "Undo" -> reverts status. New event added.
        // "Undo" again -> reverts the revert. (Redo-ish).

        return { ok: true, message: `Reverted to ${prevStatus}` };
      }
    }
  }
  return { ok: false, message: "Nothing to undo" };
}

/** --- Real-time Logic --- **/

export function subscribeToProject(projectId: string, callback: (type: string, data: any) => void) {
  const handler = (payload: { type: string; data: any }) => callback(payload.type, payload.data);
  eventEmitter.on(`update:${projectId}`, handler);
  return () => eventEmitter.off(`update:${projectId}`, handler);
}

function notifyListeners(projectId: string, type: string, data: any) {
  eventEmitter.emit(`update:${projectId}`, { type, data });
}
