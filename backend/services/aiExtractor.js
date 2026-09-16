import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a meeting-analysis engine. You extract action items from meeting transcripts.

You will be given:
1. A raw transcript.
2. Deterministic hints: candidate participant names and candidate date phrases already found via regex.

Your job is ONLY the ambiguous, semantic part:
- Decide which sentences are actually action items (a task someone must do), not just discussion.
- Resolve WHO owns each action item (use the hints, but you may find owners the regex missed).
- Resolve the deadline in plain English (use hints where relevant), and also return an ISO 8601 date if it can be reasonably inferred (assume "today" = the meetingDate provided; otherwise return null).
- Assign a priority: High, Medium, or Low, based on urgency language, deadline proximity, and stated importance.
- Include a short "context" field: the exact sentence(s) from the transcript this was extracted from.
- Include a "confidence" score from 0 to 1 reflecting how certain you are this is a real, correctly-attributed action item.

Return ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:

{
  "tasks": [
    {
      "actionItem": "string",
      "owner": "string (use 'Unassigned' if unclear)",
      "deadline": "string or null (human readable, e.g. 'next Friday')",
      "deadlineISO": "string or null (ISO 8601 date, e.g. '2026-09-02')",
      "priority": "High" | "Medium" | "Low",
      "context": "string",
      "confidence": 0.0
    }
  ]
}

If there are no action items, return {"tasks": []}. Do not invent tasks that aren't supported by the transcript.`;

function cleanAndParseJSON(rawText) {
  if (!rawText) throw new Error("Empty response from AI model");
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed.tasks) ? parsed.tasks : [];
}

async function extractWithOpenAI({ apiKey, userPrompt }) {
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const rawText = response.choices?.[0]?.message?.content;
  return cleanAndParseJSON(rawText);
}

// Heuristic rule-based extractor for Demo Mode when no OpenAI key is configured
function extractTasksHeuristic({ transcript, datesHint, participantsHint }) {
  const sentences = transcript
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const actionKeywords = [
    "will", "need to", "needs to", "must", "action item", "todo",
    "should", "responsible for", "follow up", "send", "prepare",
    "review", "complete", "schedule", "update", "create", "fix",
    "deploy", "finalize"
  ];

  const tasks = [];
  const lowerParticipants = participantsHint.map((p) => p.toLowerCase());

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const hasActionWord = actionKeywords.some((kw) => lowerSentence.includes(kw));

    if (hasActionWord) {
      // Find candidate owner from participants
      let owner = "Unassigned";
      for (let i = 0; i < participantsHint.length; i++) {
        if (lowerSentence.includes(lowerParticipants[i])) {
          owner = participantsHint[i];
          break;
        }
      }

      // Check speaker attribution like "Alice: I will fix..."
      const speakerMatch = sentence.match(/^([A-Z][a-zA-Z0-9_ -]{1,20}):/);
      if (speakerMatch && owner === "Unassigned") {
        owner = speakerMatch[1];
      }

      // Find candidate deadline from datesHint
      let deadline = null;
      for (const d of datesHint) {
        if (lowerSentence.includes(d.toLowerCase())) {
          deadline = d;
          break;
        }
      }

      // Determine priority
      let priority = "Medium";
      if (/urgent|asap|today|critical|immediately/i.test(sentence)) {
        priority = "High";
      } else if (/eventually|when possible|later|someday|low priority/i.test(sentence)) {
        priority = "Low";
      }

      // Clean action item text
      let actionItem = sentence.replace(/^[A-Z][a-zA-Z0-9_ -]{1,20}:\s*/, "").trim();
      if (actionItem.length > 120) {
        actionItem = actionItem.slice(0, 117) + "...";
      }

      tasks.push({
        actionItem,
        owner,
        deadline,
        deadlineISO: null,
        priority,
        context: sentence,
        confidence: owner !== "Unassigned" ? 0.8 : 0.65,
      });
    }
  }

  // If no specific action sentences matched, generate at least one fallback from first substantive sentence
  if (tasks.length === 0 && sentences.length > 0) {
    tasks.push({
      actionItem: `Review and follow up on: "${sentences[0].slice(0, 80)}..."`,
      owner: participantsHint[0] || "Unassigned",
      deadline: datesHint[0] || null,
      deadlineISO: null,
      priority: "Medium",
      context: sentences[0],
      confidence: 0.6,
    });
  }

  return tasks;
}

export async function extractTasksFromTranscript({
  transcript,
  datesHint,
  participantsHint,
  meetingDate,
  userApiKey,
}) {
  const openaiKey = userApiKey?.trim() || process.env.OPENAI_API_KEY?.trim();

  // If no OpenAI key is configured, seamlessly run heuristic Demo Mode
  if (!openaiKey) {
    return {
      tasks: extractTasksHeuristic({ transcript, datesHint, participantsHint }),
      isDemoMode: true,
    };
  }

  const userPrompt = `Meeting date: ${meetingDate}

Candidate participant names (from regex, may be incomplete or slightly wrong): ${
    participantsHint.length ? participantsHint.join(", ") : "none detected"
  }

Candidate date phrases (from regex): ${
    datesHint.length ? datesHint.join(", ") : "none detected"
  }

Transcript:
"""
${transcript}
"""`;

  const tasks = await extractWithOpenAI({ apiKey: openaiKey, userPrompt });
  return { tasks, isDemoMode: false };
}




