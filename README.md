# Meeting → Tasks AI

Extracts action items, owners, deadlines, and priorities from meeting transcripts.

## Architecture

```
transcript --> [preprocess.js: regex dates/names] --> hints
                                                          |
                                                          v
                                          [aiExtractor.js: OpenAI GPT-4o]
                                                          |
                                                          v
                                          structured tasks --> MongoDB
```

- **Deterministic preprocessing** (`backend/services/preprocess.js`): regex extracts
  candidate dates and participant names. Cheap, fast, no API cost, no hallucination risk.
- **LLM extraction** (`backend/services/aiExtractor.js`): OpenAI GPT-4o handles the
  semantic part — deciding what's *actually* an action item, resolving owners,
  and judging priority/confidence based on regex hints.
- Every task stores its `context` (source sentence) and a `confidence` score for human review.

## Stack

- MongoDB + Mongoose
- Express (Node.js)
- React + Vite + Tailwind CSS
- OpenAI API (`openai`) with GPT-4o

---

## 🔑 Important: API Key Configuration

> **Note on Deployment & Testing (Vercel / Local):**  
> To protect API keys and prevent unauthorized usage, **no OpenAI API key is hardcoded or bundled** in this repository or live deployment.
>
> 👉 **You must provide your own OpenAI API key for task extraction to work.**
>
> 1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys).
> 2. Add `OPENAI_API_KEY=your_openai_api_key` to your environment variables:
>    - **Local run:** Add it to `backend/.env`.
>    - **Vercel / Cloud deployment:** Add `OPENAI_API_KEY` and `MONGO_URI` under **Project Settings → Environment Variables**.

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI and OPENAI_API_KEY
npm run dev
```

Runs on `http://localhost:5000`.

- You need a running MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster — paste its connection string into `MONGO_URI`).
- Add your OpenAI API key to `OPENAI_API_KEY` in `backend/.env`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` calls to the backend.


## API

| Method | Route                              | Description                          |
|--------|-------------------------------------|---------------------------------------|
| POST   | `/api/meetings`                     | Submit a transcript, runs extraction |
| GET    | `/api/meetings`                     | List all meetings                    |
| GET    | `/api/meetings/:id`                 | Get one meeting + its tasks          |
| DELETE | `/api/meetings/:id`                 | Delete a meeting + its tasks         |
| PATCH  | `/api/meetings/tasks/:taskId`       | Edit a task's fields                 |
| PATCH  | `/api/meetings/tasks/:taskId/status`| confirm / reject / mark done         |

## Open questions from your notes (recommended path)

**Audio vs. transcript** — Build this as transcript-only for now. If you want audio
input later, add a separate transcription step (e.g. Whisper API) that outputs plain
text, then feeds into this same pipeline unchanged. Don't couple STT reliability with
extraction logic.

**JIRA integration** — Not in this MVP. Once extraction accuracy is solid and you have
a confirm/reject review step (already scaffolded here via `task.status`), add a
"push to JIRA" action that POSTs confirmed tasks to JIRA's REST API
(`/rest/api/3/issue`), mapping `owner` → assignee, `priority` → JIRA priority,
`deadline` → due date.

## Next steps worth prioritizing

1. **Review/confirm UI** is already there (Confirm / Reject / Mark Done buttons) —
   use it. Don't auto-trust LLM output for anything downstream like notifications.
2. **Batch/streaming for long transcripts** — right now the whole transcript goes in
   one prompt. For 1hr+ meetings you may want to chunk and merge, or rely on a
   large-context model call as-is (Claude's context window can likely handle it,
   test with real transcripts first).
3. **Speaker diarization quality** — if your transcripts come from a tool without
   clean "Name: text" formatting, the regex owner-hints will be weaker and the LLM
   will lean harder on prose patterns ("John will handle..."). Test with your actual
   transcript format early.
