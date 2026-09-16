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

export async function extractTasksFromTranscript({
  transcript,
  datesHint,
  participantsHint,
  meetingDate,
}) {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (!openaiKey) {
    throw new Error(
      "OpenAI API key is missing. Please configure OPENAI_API_KEY in your environment to extract action items."
    );
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

  return await extractWithOpenAI({ apiKey: openaiKey, userPrompt });
}



