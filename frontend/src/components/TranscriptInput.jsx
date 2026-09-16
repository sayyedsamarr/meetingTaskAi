import { useState } from "react";
import { createMeeting } from "../api";

export default function TranscriptInput({ onExtracted }) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await createMeeting({ title, transcript });
      onExtracted(data);
      setTranscript("");
      setTitle("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-base-surface border border-base-border rounded-xl p-4 flex flex-col gap-3"
    >
      <input
        type="text"
        placeholder="Meeting title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-base-surface-2 border border-base-border rounded-lg px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
      />
      <textarea
        placeholder="Paste meeting transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={12}
        className="bg-base-surface-2 border border-base-border rounded-lg px-3 py-2.5 text-sm leading-relaxed placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors resize-y font-mono"
      />
      <div className="flex items-center justify-between">
        <label className="text-xs text-ink-muted hover:text-brand cursor-pointer underline decoration-dotted underline-offset-4 transition-colors">
          Upload .txt file
          <input type="file" accept=".txt" onChange={handleFile} hidden />
        </label>
        <button
          type="submit"
          disabled={loading || !transcript.trim()}
          className="bg-brand hover:bg-brand/90 disabled:bg-base-border disabled:text-ink-faint disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? "Extracting tasks…" : "Extract Action Items"}
        </button>
      </div>
      {error && (
        <p className="text-signal-high text-xs font-mono">{error}</p>
      )}
    </form>
  );
}
