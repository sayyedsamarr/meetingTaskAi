import { useState, useRef, useEffect } from "react";
import { updateTaskStatus, updateTask } from "../api";

const PRIORITY_STYLES = {
  High: "bg-signal-high/15 text-signal-high border-signal-high/30",
  Medium: "bg-signal-medium/15 text-signal-medium border-signal-medium/30",
  Low: "bg-signal-low/15 text-signal-low border-signal-low/30",
};

const STATUS_STYLES = {
  pending: "",
  confirmed: "border-l-2 border-l-signal-low",
  done: "opacity-60",
  rejected: "opacity-40 line-through decoration-ink-faint",
};

// Inline Action Item Editor with auto-resizing textarea
function InlineActionItem({ value, taskId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateTask(taskId, { actionItem: trimmed });
      onSaved(data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update action item:", err);
      alert("Failed to save changes. Please check backend connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-1.5 my-1">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          rows={1}
          placeholder="Task description..."
          className="w-full bg-base-surface-2 border border-brand/80 rounded-lg px-2.5 py-1.5 text-[15px] text-ink font-medium focus:outline-none focus:ring-1 focus:ring-brand resize-none transition-all leading-snug"
        />
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-2 py-0.5 bg-brand text-base-bg font-medium rounded hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            disabled={saving}
            className="px-2 py-0.5 text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <span className="text-[11px] text-ink-faint hidden sm:inline">
            (Enter to save, Esc to cancel)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit action item"
      className="group/desc cursor-pointer rounded-md -mx-1 px-1 py-0.5 hover:bg-base-surface-2/60 transition-colors relative"
    >
      <div className="inline-flex items-start gap-1.5 w-full">
        <span className="text-[15px] font-medium text-ink leading-snug break-words flex-1">
          {value || <span className="text-ink-faint italic">No description</span>}
        </span>
        <svg
          className="w-3.5 h-3.5 text-brand opacity-0 group-hover/desc:opacity-80 transition-opacity shrink-0 mt-1"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
        </svg>
      </div>
    </div>
  );
}

// Inline Owner Editor
function InlineOwner({ value, taskId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateTask(taskId, { owner: trimmed || "Unassigned" });
      onSaved(data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update owner:", err);
      alert("Failed to save owner update");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(value || "");
              setEditing(false);
            }
          }}
          disabled={saving}
          placeholder="Owner name..."
          className="bg-base-surface-2 border border-brand rounded px-1.5 py-0.5 text-xs text-ink focus:outline-none w-28"
        />
      </span>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit owner"
      className="group/owner cursor-pointer inline-flex items-center gap-1 rounded hover:bg-base-surface-2/60 px-1 py-0.5 -mx-1 hover:text-brand transition-colors"
    >
      <span>{value || <span className="text-ink-faint italic">+ Add owner</span>}</span>
      <svg
        className="w-2.5 h-2.5 opacity-0 group-hover/owner:opacity-70 transition-opacity shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
      </svg>
    </span>
  );
}

// Inline Deadline Editor with both text input and native date helper
function InlineDeadline({ value, taskId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const saveValue = async (newVal) => {
    const trimmed = newVal.trim();
    if (trimmed === (value || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateTask(taskId, { deadline: trimmed });
      onSaved(data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update deadline:", err);
      alert("Failed to save deadline update");
    } finally {
      setSaving(false);
    }
  };

  const handleDatePick = (e) => {
    const picked = e.target.value;
    if (picked) {
      setDraft(picked);
      saveValue(picked);
    }
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => saveValue(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveValue(draft);
            if (e.key === "Escape") {
              setDraft(value || "");
              setEditing(false);
            }
          }}
          disabled={saving}
          placeholder="e.g. Next Friday, Oct 12"
          className="bg-base-surface-2 border border-brand rounded px-1.5 py-0.5 text-xs text-ink focus:outline-none w-36"
        />
        {/* Quick Date Picker button */}
        <label
          title="Pick calendar date"
          className="cursor-pointer text-xs bg-base-surface-2 hover:bg-brand/20 px-1 py-0.5 rounded border border-base-border hover:border-brand transition-colors"
        >
          📅
          <input
            type="date"
            className="sr-only"
            onChange={handleDatePick}
          />
        </label>
      </span>
    );
  }

  const hasDeadline = Boolean(value && value.trim() && value.toLowerCase() !== "no deadline");

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit deadline"
      className="group/deadline cursor-pointer inline-flex items-center gap-1 rounded hover:bg-base-surface-2/60 px-1 py-0.5 -mx-1 hover:text-brand transition-colors"
    >
      <span>
        {hasDeadline ? value : <span className="text-ink-faint italic">+ Add deadline</span>}
      </span>
      <svg
        className="w-2.5 h-2.5 opacity-0 group-hover/deadline:opacity-70 transition-opacity shrink-0"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
      </svg>
    </span>
  );
}

// Inline Priority Selector
function InlinePriority({ value, taskId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (newVal) => {
    if (newVal === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateTask(taskId, { priority: newVal });
      onSaved(data);
    } catch (err) {
      console.error("Failed to update priority:", err);
      alert("Failed to update priority");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={value}
        onChange={(e) => save(e.target.value)}
        onBlur={() => setEditing(false)}
        disabled={saving}
        className="text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border bg-base-surface-2 border-brand text-ink focus:outline-none cursor-pointer"
      >
        {["High", "Medium", "Low"].map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to change priority (High / Medium / Low)"
      className={`text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-85 transition-opacity ${PRIORITY_STYLES[value] || PRIORITY_STYLES.Medium}`}
    >
      {value || "Medium"} ▾
    </span>
  );
}

function getConfidenceTier(confidence) {
  const score = typeof confidence === "number" ? confidence : 0.5;
  if (score >= 0.85) {
    return {
      label: "High Certainty",
      textColor: "text-signal-low",
      badgeColor: "bg-signal-low/15 text-signal-low border-signal-low/30",
      barColor: "#4fb286",
    };
  }
  if (score >= 0.6) {
    return {
      label: "Review Required",
      textColor: "text-signal-medium",
      badgeColor: "bg-signal-medium/15 text-signal-medium border-signal-medium/30",
      barColor: "#e0a458",
    };
  }
  return {
    label: "Flagged (<60%)",
    textColor: "text-signal-high",
    badgeColor: "bg-signal-high/15 text-signal-high border-signal-high/30",
    barColor: "#ef6461",
  };
}

export default function TaskCard({ task, onUpdated }) {
  const [localTask, setLocalTask] = useState(task);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  const handleStatus = async (status) => {
    setStatusLoading(true);
    try {
      const { data } = await updateTaskStatus(localTask._id, status);
      setLocalTask(data);
      onUpdated(data);
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert("Failed to update task status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaved = (updated) => {
    setLocalTask(updated);
    onUpdated(updated);
  };

  const confidenceScore = typeof localTask.confidence === "number" ? localTask.confidence : 0.5;
  const confidencePct = Math.round(confidenceScore * 100);
  const tier = getConfidenceTier(confidenceScore);

  return (
    <div
      className={`bg-base-surface border border-base-border rounded-xl p-4 transition-all ${confidenceScore < 0.6 ? "border-signal-high/40 bg-signal-high/[0.02]" : ""
        } ${STATUS_STYLES[localTask.status] || ""}`}
    >
      {/* Top row: priority badge + confidence bar */}
      <div className="flex items-center justify-between mb-2.5">
        <InlinePriority
          value={localTask.priority}
          taskId={localTask._id}
          onSaved={handleSaved}
        />

        <div
          className="flex items-center gap-2"
          title={`AI extraction confidence: ${confidencePct}% (${tier.label})`}
        >
          <div className="h-1.5 w-16 bg-base-surface-2 rounded-full overflow-hidden border border-base-border/50">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${confidencePct}%`,
                backgroundColor: tier.barColor,
              }}
            />
          </div>
          <span className={`font-mono text-[11px] font-medium tabular-nums ${tier.textColor}`}>
            {confidencePct}%
          </span>
          {confidenceScore < 0.6 && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border bg-signal-high/15 text-signal-high border-signal-high/30 font-medium">
              Flagged
            </span>
          )}
        </div>
      </div>

      {/* Action item — inline editable */}
      <div className="mb-2.5">
        <InlineActionItem
          value={localTask.actionItem}
          taskId={localTask._id}
          onSaved={handleSaved}
        />
      </div>

      {/* Owner + Deadline — inline editable */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted mb-2.5 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint">👤</span>
          <InlineOwner
            value={localTask.owner}
            taskId={localTask._id}
            onSaved={handleSaved}
          />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint">📅</span>
          <InlineDeadline
            value={localTask.deadline}
            taskId={localTask._id}
            onSaved={handleSaved}
          />
        </span>
      </div>

      {/* Context quote */}
      {localTask.context && (
        <p className="text-xs text-ink-faint italic mb-3 border-l-2 border-base-border pl-2.5 line-clamp-2 hover:line-clamp-none transition-all">
          "{localTask.context}"
        </p>
      )}

      {/* Status actions */}
      <div className="flex items-center justify-between pt-1 border-t border-base-border/50">
        <div className="flex gap-2">
          <button
            disabled={statusLoading || localTask.status === "confirmed"}
            onClick={() => handleStatus("confirmed")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-signal-low/40 text-signal-low hover:bg-signal-low/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm
          </button>
          <button
            disabled={statusLoading || localTask.status === "done"}
            onClick={() => handleStatus("done")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-base-border text-ink hover:bg-base-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Mark Done
          </button>
          <button
            disabled={statusLoading || localTask.status === "rejected"}
            onClick={() => handleStatus("rejected")}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-signal-high/40 text-signal-high hover:bg-signal-high/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
        </div>

        <span className="text-[11px] font-mono text-ink-faint capitalize">
          {localTask.status}
        </span>
      </div>
    </div>
  );
}

