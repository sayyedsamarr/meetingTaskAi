import Meeting from "../models/Meeting.js";
import Task from "../models/Task.js";
import { preprocessTranscript } from "../services/preprocess.js";
import { extractTasksFromTranscript } from "../services/aiExtractor.js";

function validateAndDeduplicateTasks(extractedTasks, transcript) {
  if (!Array.isArray(extractedTasks) || extractedTasks.length === 0) {
    return [];
  }

  const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, " ");
  const processed = [];
  const seenActionItems = [];

  for (const t of extractedTasks) {
    if (!t.actionItem || !t.actionItem.trim()) continue;

    let confidence =
      typeof t.confidence === "number"
        ? Math.max(0, Math.min(1, t.confidence))
        : 0.5;

    const rawContext = (t.context || "").trim();
    const cleanContext = rawContext.toLowerCase().replace(/\s+/g, " ");

    // 1. Anti-hallucination check: context must exist in transcript
    let contextVerified = false;
    if (cleanContext && cleanContext.length > 5) {
      if (normalizedTranscript.includes(cleanContext)) {
        contextVerified = true;
      } else {
        // Fallback snippet check (first 4 substantive words)
        const words = cleanContext.split(" ").filter((w) => w.length > 2);
        if (words.length >= 4) {
          const windowStr = words.slice(0, 4).join(" ");
          if (normalizedTranscript.includes(windowStr)) {
            contextVerified = true;
          }
        }
      }
    }

    // Penalize confidence if context could not be verified in original transcript
    if (rawContext && !contextVerified) {
      confidence = Math.min(confidence, 0.45);
    }

    // 2. Deduplication check against already added items
    const normAction = t.actionItem.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isDuplicate = seenActionItems.some((seen) => {
      if (normAction === seen) return true;
      if (normAction.length > 15 && seen.length > 15) {
        if (normAction.includes(seen) || seen.includes(normAction)) return true;
      }
      return false;
    });

    if (isDuplicate) {
      continue;
    }
    seenActionItems.push(normAction);

    processed.push({
      actionItem: t.actionItem.trim(),
      owner: (t.owner && t.owner.trim()) || "Unassigned",
      deadline: (t.deadline && t.deadline.trim()) || null,
      deadlineISO: t.deadlineISO && !isNaN(new Date(t.deadlineISO)) ? new Date(t.deadlineISO) : null,
      priority: ["High", "Medium", "Low"].includes(t.priority)
        ? t.priority
        : "Medium",
      context: rawContext,
      confidence: Number(confidence.toFixed(2)),
    });
  }

  return processed;
}

export const createMeeting = async (req, res) => {
  try {
    const { title, transcript, meetingDate } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const { datesHint, participantsHint } = preprocessTranscript(transcript);

    const meeting = await Meeting.create({
      title: title || "Untitled Meeting",
      transcript,
      meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
      participantsHint,
      datesHint,
      status: "processing",
    });

    try {
      const rawExtractedTasks = await extractTasksFromTranscript({
        transcript,
        datesHint,
        participantsHint,
        meetingDate: meeting.meetingDate.toISOString().split("T")[0],
      });

      // Step 3 Validation: Anti-hallucination check, confidence calibration, dedup
      const validatedTasks = validateAndDeduplicateTasks(
        rawExtractedTasks,
        transcript
      );

      const savedTasks = await Task.insertMany(
        validatedTasks.map((t) => ({
          meeting: meeting._id,
          ...t,
        }))
      );

      meeting.status = "completed";
      await meeting.save();

      return res.status(201).json({ meeting, tasks: savedTasks });
    } catch (extractionErr) {
      meeting.status = "failed";
      await meeting.save();
      console.error("Extraction failed:", extractionErr);
      return res.status(502).json({
        error: "Meeting saved but task extraction failed",
        details: extractionErr.message,
        meeting,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

export const getMeetings = async (req, res) => {
  const meetings = await Meeting.find().sort({ createdAt: -1 });
  res.json(meetings);
};

export const getMeetingWithTasks = async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  const tasks = await Task.find({ meeting: meeting._id }).sort({
    priority: 1,
    createdAt: 1,
  });
  res.json({ meeting, tasks });
};

export const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "rejected", "done"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { status },
    { new: true }
  );
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
};

export const updateTask = async (req, res) => {
  const allowedFields = ["actionItem", "owner", "deadline", "priority"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const task = await Task.findByIdAndUpdate(req.params.taskId, updates, {
    new: true,
  });
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
};

export const deleteMeeting = async (req, res) => {
  const meeting = await Meeting.findByIdAndDelete(req.params.id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  await Task.deleteMany({ meeting: meeting._id });
  res.json({ message: "Meeting and its tasks deleted" });
};
