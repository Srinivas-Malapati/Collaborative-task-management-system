"use client";

import { useEffect, useMemo, useState } from "react";
import type { Comment, Project, Task, TaskStatus } from "@/lib/types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority] || "text-zinc-400 bg-zinc-800 border-zinc-700";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${style} uppercase tracking-wider`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles = {
    todo: "bg-zinc-800 text-zinc-400 border-zinc-700",
    in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    done: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}) {
  const priority = task.configuration.priority || "medium";

  return (
    <button
      onClick={onSelect}
      className={[
        "group w-full text-left p-3 rounded-lg border transition-all duration-200 outline-none",
        "hover:shadow-lg hover:-translate-y-0.5",
        selected
          ? "bg-zinc-800/90 border-blue-500/50 shadow-md ring-1 ring-blue-500/20"
          : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800 hover:border-zinc-700",
      ].join(" ")}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className={`font-medium text-sm leading-snug truncate pr-2 ${selected ? "text-blue-100" : "text-zinc-200 group-hover:text-white"}`}>
          {task.title}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.assignedTo[0] && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300 ring-1 ring-indigo-500/30">
              {task.assignedTo[0].charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
            {task.id.toUpperCase()}
          </span>
        </div>
        <PriorityBadge priority={priority} />
      </div>
    </button>
  );
}

export default function TaskBoard({ project: initialProject }: { project: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialProject.tasks[0]?.id ?? null
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high" });

  // Fetch comments when selected task changes
  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    fetch(`/api/comments?taskId=${selectedId}`)
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load comments", err));
  }, [selectedId]);

  // Real-time subscription
  useEffect(() => {
    const eventSource = new EventSource(`/api/projects/${initialProject.id}/stream`);

    eventSource.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const updatedProject = JSON.parse(event.data);
        setProject(updatedProject);
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    // Listen for delta updates
    // Listen for delta updates
    eventSource.addEventListener("task_update", (event) => {
      try {
        const updatedTask = JSON.parse(event.data) as Task;
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        }));
      } catch (err) {
        console.error("Failed to parse task update", err);
      }
    });

    eventSource.addEventListener("comment_add", (event) => {
      try {
        const newComment = JSON.parse(event.data) as Comment;
        setComments((prev) => {
          // Only add if it belongs to selected task and isn't already there (dedupe)
          if (selectedId && newComment.taskId === selectedId) {
            if (prev.find(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to parse comment", err);
      }
    });

    eventSource.addEventListener("task_add", (event) => {
      try {
        const newTaskData = JSON.parse(event.data) as Task;
        setProject((prev) => ({
          ...prev,
          tasks: [...prev.tasks, newTaskData],
        }));
      } catch (err) {
        console.error("Failed to parse new task", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [initialProject.id, selectedId]);

  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    project.tasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t);
    });
    return groups;
  }, [project.tasks]);

  const selected = useMemo(
    () => project.tasks.find((t) => t.id === selectedId) ?? null,
    [project.tasks, selectedId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">

      {/* LEFT: Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => (
          <div key={status} className="flex flex-col gap-4">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'todo' ? 'bg-zinc-500' :
                  status === 'in_progress' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                  {STATUS_LABEL[status]}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                {tasksByStatus[status].length}
              </span>
            </div>

            {/* Tasks List */}
            <div className="flex flex-col gap-3">
              {tasksByStatus[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={task.id === selectedId}
                  onSelect={() => setSelectedId(task.id)}
                />
              ))}
              {tasksByStatus[status].length === 0 && (
                <div className="h-24 rounded-lg border border-dashed border-zinc-800/50 flex items-center justify-center text-zinc-700 text-xs italic bg-zinc-900/20">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: Details Panel */}
      <div className="lg:sticky lg:top-24 rounded-xl border border-zinc-800 bg-zinc-900/30 p-0 shadow-xl overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center text-zinc-500 space-y-4 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center">
              <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-sm">Click a task to view details</p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                  {selected.id.toUpperCase()}
                </span>

                <select
                  value={selected.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as TaskStatus;
                    try {
                      const res = await fetch(`/api/tasks/${selected.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        throw new Error(data.error || "Failed to update status");
                      }

                      // Immediate update
                      const updatedTask = data.task;
                      setProject((prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
                      }));
                    } catch (err: any) {
                      console.error("Task update error:", err);
                      alert(err.message || "Failed to update task status");
                    }
                  }}
                  className="bg-zinc-800 border-zinc-700 text-xs text-zinc-300 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold text-white leading-snug">
                  {selected.title}
                </h2>
                <button
                  onClick={async () => {
                    if (!confirm("Undo last action?")) return;
                    try {
                      await fetch(`/api/projects/${selected.projectId}/undo`, { method: "POST" });
                      // No need to manually update state, SSE will handle it
                    } catch (err) {
                      console.error("Undo failed", err);
                    }
                  }}
                  className="text-[10px] text-zinc-500 hover:text-white underline decoration-zinc-700 underline-offset-4"
                >
                  Undo Last
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Assignee</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px]">
                      {selected.assignedTo[0]?.charAt(0).toUpperCase()}
                    </div>
                    <span>{selected.assignedTo[0] || "Unassigned"}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Priority</div>
                  <PriorityBadge priority={selected.configuration.priority || "medium"} />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Description</div>
                <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {selected.description || "No description provided."}
                </div>
              </div>

              {/* Activity */}
              <div className="pt-4 border-t border-zinc-800/50">
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-3">Comments</div>
                {/* Comment List */}
                <div className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-zinc-800/40 p-3 rounded-md border border-zinc-800">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-bold text-zinc-300">{comment.author}</span>
                          <span className="text-[10px] text-zinc-600">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-snug">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-800 border-zinc-700 text-sm text-zinc-200 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && commentInput.trim()) {
                        const content = commentInput;
                        setCommentInput(""); // optimistic clear
                        try {
                          await fetch('/api/comments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ taskId: selected.id, content, author: "Me" })
                          });
                        } catch (err) {
                          console.error(err);
                          setCommentInput(content); // restore on fail
                        }
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!commentInput.trim()) return;
                      const content = commentInput;
                      setCommentInput("");
                      try {
                        await fetch('/api/comments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ taskId: selected.id, content, author: "Me" })
                        });
                      } catch (err) {
                        console.error(err);
                        setCommentInput(content);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div >
  );
}
