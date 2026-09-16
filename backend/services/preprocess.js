/**
 * Deterministic preprocessing.
 * No LLM calls here — pure regex/heuristics. This gives the LLM step
 * cheap, reliable hints instead of asking it to find everything from scratch.
 */

// Common relative/absolute date phrases people say out loud in meetings
const DATE_PATTERNS = [
  /\b(today|tomorrow|tonight)\b/gi,
  /\b(next|this|end of)\s+(week|month|sprint|quarter)\b/gi,
  /\b(mon|tue|wed|thu|fri|sat|sun)(day)?\b/gi,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\b/gi,
  /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g,
  /\bby\s+(eod|cob|end of day|end of business)\b/gi,
  /\bin\s+\d+\s+(day|days|week|weeks)\b/gi,
];

// Speaker-label patterns commonly seen in transcripts, e.g. "John: ..." or "[John Smith]"
const SPEAKER_PATTERNS = [
  /^([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+)?)\s*:/gm,
  /^\[([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+)?)\]/gm,
];

// Common filler capitalized words that are NOT names, to filter false positives
const STOPWORDS = new Set([
  "I", "The", "A", "An", "We", "You", "They", "It", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January",
  "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December", "Today", "Tomorrow",
  "Next", "This", "Team", "Meeting", "Sprint", "Q1", "Q2", "Q3", "Q4",
]);

export function extractDateHints(transcript) {
  const found = new Set();
  for (const pattern of DATE_PATTERNS) {
    const matches = transcript.match(pattern) || [];
    matches.forEach((m) => found.add(m.trim()));
  }
  return Array.from(found);
}

export function extractParticipantHints(transcript) {
  const found = new Set();

  for (const pattern of SPEAKER_PATTERNS) {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      const name = match[1].trim();
      if (!STOPWORDS.has(name)) found.add(name);
    }
  }

  // Fallback: look for "<Name> will/should/needs to/is going to" patterns —
  // strong signal of an owner being assigned a task in prose-style transcripts
  const ownerAssignPattern =
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(will|should|needs to|is going to|has to|can you|please)\b/g;
  let m;
  while ((m = ownerAssignPattern.exec(transcript)) !== null) {
    const name = m[1].trim();
    if (!STOPWORDS.has(name) && name.split(" ").length <= 2) {
      found.add(name);
    }
  }

  return Array.from(found);
}

export function preprocessTranscript(transcript) {
  return {
    datesHint: extractDateHints(transcript),
    participantsHint: extractParticipantHints(transcript),
  };
}
