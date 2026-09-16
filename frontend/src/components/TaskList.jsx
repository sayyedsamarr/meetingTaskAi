import TaskCard from "./TaskCard";

export default function TaskList({ tasks, setTasks }) {
  if (!tasks.length) {
    return (
      <p className="text-sm text-ink-faint font-mono border border-dashed border-base-border rounded-xl px-4 py-6 text-center">
        no action items yet — extract a transcript to see tasks here
      </p>
    );
  }

  const handleUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} onUpdated={handleUpdated} />
      ))}
    </div>
  );
}
