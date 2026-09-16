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