import { useState } from "react";
import { createMeeting } from "../api";

export default function TranscriptInput({ onExtracted }) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demoNotice, setDemoNotice] = useState(null);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return sessionStorage.getItem("meeting_ai_openai_key") || "";
    } catch {
      return "";
    }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    try {
      if (val.trim()) {
        sessionStorage.setItem("meeting_ai_openai_key", val.trim());
      } else {
        sessionStorage.removeItem("meeting_ai_openai_key");
      }
    } catch (err) {
      console.warn("sessionStorage unavailable:", err);
    }
  };


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
    setDemoNotice(null);
    try {
      const { data } = await createMeeting({ title, transcript }, apiKey);
      onExtracted(data);
      if (data.isDemoMode) {
        setDemoNotice("Extracted using Demo Heuristic Mode (no OpenAI API key configured). Add your OpenAI key below for full GPT-4o extraction.");
      }
      setTranscript("");
      setTitle("");
    } catch (err) {
      const data = err.response?.data;
      let msg = "Something went wrong while processing the transcript.";

      if (typeof data?.error === "string") {
        msg = data.error;
      } else if (typeof data?.details === "string") {
        msg = data.details;
      } else if (typeof data?.error?.message === "string") {
        msg = data.error.message;
      } else if (typeof data?.message === "string") {
        msg = data.message;
      } else if (err.response?.status === 404) {
        msg = "Backend API not reachable (404). If deployed on Vercel, make sure the backend serverless function is configured.";
      } else if (typeof err.message === "string") {
        msg = err.message;
      }

      setError(msg);
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

      {/* API Key Toggle and Input */}
      <div className="border-t border-base-border/60 pt-2 text-xs">
        <button
          type="button"
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-ink-muted hover:text-brand flex items-center gap-1.5 transition-colors"
        >
          <span>🔑</span>
          <span>{showKeyInput ? "Hide OpenAI API Key settings" : "Use your own OpenAI API key (optional)"}</span>
          {apiKey && <span className="text-signal-low text-[11px] font-mono">(Key saved)</span>}
        </button>

        {showKeyInput && (
          <div className="mt-2 space-y-1 bg-base-surface-2/60 p-2.5 rounded-lg border border-base-border/50">
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="sk-proj-... (optional, clears when tab is closed)"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="flex-1 bg-base-surface-2 border border-base-border rounded px-2.5 py-1.5 text-xs placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={() => handleApiKeyChange("")}
                  className="text-xs text-ink-muted hover:text-signal-high px-1"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-ink-faint leading-tight">
              Without a key, the app runs in free <strong>Demo Mode</strong>.
            </p>
          </div>
        )}
      </div>

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

      {demoNotice && (
        <div className="p-3 bg-brand/10 border border-brand/30 rounded-lg flex items-start gap-2">
          <span className="text-brand text-sm leading-none mt-0.5">⚡</span>
          <p className="text-brand text-xs leading-relaxed">{demoNotice}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-signal-high/10 border border-signal-high/30 rounded-lg flex items-start gap-2">
          <span className="text-signal-high text-sm leading-none mt-0.5">⚠️</span>
          <p className="text-signal-high text-xs font-mono leading-relaxed">{error}</p>
        </div>
      )}
    </form>
  );
}


