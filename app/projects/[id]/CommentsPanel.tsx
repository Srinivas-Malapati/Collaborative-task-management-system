"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: string;
  taskId: string;
  author: string;
  message: string;
  createdAt: string;
};

type TaskEvent = {
  id: string;
  taskId: string;
  type: "STATUS_CHANGED" | "COMMENT_ADDED";
  message: string;
  createdAt: string;
};

export default function CommentsPanel({ projectId }: { projectId: string }) {
  const [taskId, setTaskId] = useState("t2");
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [author, setAuthor] = useState("Srinivas");
  const [message, setMessage] = useState("");

  async function load() {
    const [cRes, eRes] = await Promise.all([
      fetch(`/api/tasks/${taskId}/comments`, { cache: "no-store" }),
      fetch(`/api/projects/${projectId}/events`, { cache: "no-store" })
    ]);

    const cJson = await cRes.json();
    const eJson = await eRes.json();

    setComments(cJson.comments ?? []);
    setEvents(eJson.events ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function submit() {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, message })
    });

    if (res.ok) {
      setMessage("");
      await load();
    }
  }

  return (
    <aside
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 16
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>Comments & Events</h2>

      <div style={{ marginTop: 10 }}>
        <div style={{ opacity: 0.75, marginBottom: 6 }}>Task ID to view comments</div>
        <input
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white"
          }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Comments</div>
        {comments.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No comments</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 10
                }}
              >
                <div style={{ fontWeight: 800 }}>{c.author}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>{c.message}</div>
                <div style={{ opacity: 0.55, marginTop: 6, fontSize: 12 }}>{c.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Add comment</div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white"
          }}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a comment…"
          style={{
            width: "100%",
            minHeight: 80,
            marginTop: 8,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white"
          }}
        />
        <button
          onClick={submit}
          style={{
            marginTop: 8,
            width: "100%",
            cursor: "pointer",
            borderRadius: 12,
            padding: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.08)",
            color: "white"
          }}
        >
          Post comment
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Events (project)</div>
        {events.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No events yet</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {events.slice(-10).reverse().map((e) => (
              <div
                key={e.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 10
                }}
              >
                <div style={{ fontWeight: 800 }}>{e.type}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>
                  {e.taskId}: {e.message}
                </div>
                <div style={{ opacity: 0.55, marginTop: 6, fontSize: 12 }}>{e.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
