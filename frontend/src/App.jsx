import { useState, useEffect, useCallback } from "react";
import TranscriptInput from "./components/TranscriptInput";
import TaskList from "./components/TaskList";
import { getMeetings, getMeeting, deleteMeeting } from "./api";

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetingTitle, setMeetingTitle] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  // Helper to load tasks for a specific meeting
  const loadMeetingTasks = async (meetingId) => {
    if (!meetingId) return;
    setLoadingMeeting(true);
    try {
      const { data } = await getMeeting(meetingId);
      setMeetingTitle(data.meeting?.title || "Meeting");
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch meeting tasks:", err);
    } finally {
      setLoadingMeeting(false);
    }
  };

  // Load all meetings from MongoDB on mount or update
  const loadAllMeetings = useCallback(async (selectId = null) => {
    try {
      const { data } = await getMeetings();
      setMeetings(data || []);

      if (data && data.length > 0) {
        const targetId = selectId || data[0]._id;
        setSelectedMeetingId(targetId);
        await loadMeetingTasks(targetId);
      } else {
        setSelectedMeetingId(null);
        setTasks([]);
        setMeetingTitle(null);
      }
    } catch (err) {
      console.error("Failed to load meetings list:", err);
    }
  }, []);

  useEffect(() => {
    loadAllMeetings();
  }, [loadAllMeetings]);

  const handleSelectMeeting = (id) => {
    setSelectedMeetingId(id);
    loadMeetingTasks(id);
  };

  const handleExtracted = (data) => {
    if (data.meeting?._id) {
      loadAllMeetings(data.meeting._id);
    } else {
      setTasks(data.tasks || []);
      setMeetingTitle(data.meeting?.title || "Meeting");
    }
  };

  const handleDeleteMeeting = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this meeting and its tasks?")) return;
    try {
      await deleteMeeting(id);
      const remaining = meetings.filter((m) => m._id !== id);
      setMeetings(remaining);
      if (remaining.length > 0) {
        handleSelectMeeting(remaining[0]._id);
      } else {
        setSelectedMeetingId(null);
        setTasks([]);
        setMeetingTitle(null);
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    }
  };

  const [showHistory, setShowHistory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
        <header className="mb-8">
          <p className="font-mono text-xs text-brand tracking-wide mb-2">
            transcript in / tasks out
          </p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">
            Meeting → Tasks AI
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Paste a transcript. Get owners, deadlines, and priorities out.
          </p>
        </header>

        <main className="space-y-8">
          <TranscriptInput onExtracted={handleExtracted} />

          {/* Saved Meetings selector / History bar with Toggle */}
          {meetings.length > 0 && (
            <div className="bg-base-surface border border-base-border rounded-xl p-4 transition-all">
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-mono font-medium text-ink-muted uppercase tracking-wider hover:text-ink transition-colors"
              >
                <span>Saved Meetings History ({meetings.length})</span>
                <span className="text-[11px] text-ink-faint font-normal">
                  {showHistory ? "▲ Hide" : "▼ Show"}
                </span>
              </button>

              {showHistory && (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 mt-3">
                  {meetings.map((m) => (
                    <div
                      key={m._id}
                      onClick={() => handleSelectMeeting(m._id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${m._id === selectedMeetingId
                        ? "bg-brand/10 text-brand font-medium border border-brand/20"
                        : "hover:bg-base-surface-2 text-ink"
                        }`}
                    >
                      <div className="truncate pr-2">
                        <span className="truncate">{m.title}</span>
                        <span className="text-[11px] text-ink-faint ml-2 font-mono">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteMeeting(m._id, e)}
                        title="Delete meeting"
                        className="text-xs text-ink-faint hover:text-signal-high px-1.5 py-0.5 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Meeting Task List with Toggle */}
          {meetingTitle && (
            <div className="space-y-3">
              <div
                onClick={() => setShowTasks((prev) => !prev)}
                className="flex items-center justify-between cursor-pointer group py-1"
              >
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-semibold text-ink group-hover:text-brand transition-colors">
                    {meetingTitle}
                  </h2>
                  <span className="font-mono text-xs text-ink-faint">
                    ({tasks.length} item{tasks.length === 1 ? "" : "s"})
                  </span>
                </div>

                <button
                  type="button"
                  className="text-xs font-mono text-ink-faint group-hover:text-ink transition-colors"
                >
                  {showTasks ? "▲ Hide Tasks" : "▼ Show Tasks"}
                </button>
              </div>

              {showTasks && (
                <>
                  {loadingMeeting ? (
                    <p className="text-sm text-ink-faint font-mono">
                      Loading tasks from database...
                    </p>
                  ) : (
                    <TaskList tasks={tasks} setTasks={setTasks} />
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

