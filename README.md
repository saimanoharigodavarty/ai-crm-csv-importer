# AI CRM Importer

An AI-powered CSV importer that maps leads from any CSV layout (Facebook exports, Google Ads exports, manual spreadsheets, other CRMs, etc.) into a standard CRM record format, without assuming fixed column names.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** Next.js (TypeScript)
- **AI:** Google Gemini

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:5000`. Check it's running via:

```bash
curl http://localhost:5000/health
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App starts on `http://localhost:3000`. Upload a CSV to see it parsed and previewed in a table (no AI processing happens at this stage). Clicking "Confirm Import" sends the parsed rows to the backend's `/api/extract` endpoint.

The frontend calls the backend at `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.example`), defaulting to `http://localhost:5000`.

## API Contract

`POST /api/extract`

Request body:

```json
{ "rows": [{ "Any Column Name": "value", "...": "..." }] }
```

Response body:

```json
{
  "imported": [ { "created_at": "...", "name": "...", "...": "..." } ],
  "skipped": [ { "row": { "...": "..." }, "reason": "..." } ],
  "totalImported": 0,
  "totalSkipped": 0
}
```

> Note: the extraction logic currently returns placeholder records to verify the upload → batch → response pipeline. Real AI-based field mapping is added in the next stage.
