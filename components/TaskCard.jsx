export default function TaskCard({ task, onToggle, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id, !task.done)}
      />
      <span style={{ textDecoration: task.done ? "line-through" : "none", flex: 1 }}>
        {task.title}
      </span>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  );
}
