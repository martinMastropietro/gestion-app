"use client";

import { useState, useEffect } from "react";
import TaskCard from "@/components/TaskCard";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => setError("Could not load tasks"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.trim() }),
      });
      const newTask = await res.json();
      if (!res.ok) throw new Error(newTask.error);
      setTasks((prev) => [newTask, ...prev]);
      setInput("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(id, done) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "0 16px" }}>
      <h1>Tasks</h1>

      {error && (
        <p style={{ color: "red" }}>
          {error} <button onClick={() => setError(null)}>Dismiss</button>
        </p>
      )}

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          style={{ flex: 1, padding: "6px" }}
        />
        <button type="submit">Add</button>
      </form>

      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}
