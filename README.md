# AI-Powered CRM CSV Importer

An AI-powered CSV importer that maps leads from any CSV layout (Facebook lead exports, Google Ads exports, manual spreadsheets, other CRM exports, etc.) into a standard CRM record format — without assuming fixed column names.

Upload a CSV, preview the parsed data, confirm the import, and let the backend use an LLM (Groq) to intelligently map arbitrary CSV columns into a standardized CRM schema. The extracted records are validated before being returned as imported or skipped with clear reasons.

## Features

- Drag & drop or file-picker CSV upload
- Client-side CSV parsing and preview (sticky header, scrollable table) before any AI call is made
- AI-powered semantic field mapping that understands varying column names (e.g. Phone, Mobile, Contact Number) without requiring predefined mappings
- Two-stage server-side validation of AI output: schema validation (types, enums, valid dates) and business rules (e.g. a lead must have an email or a phone number)
- Automatic retry for failed AI batches, with graceful per-batch fallback (one bad batch doesn't fail the whole import)
- Results view with import/skip counts, color-coded lead status badges, and skip reasons

## Architecture

```
                CSV Upload
                     │
                     ▼
        Client-side Parsing (PapaParse)
                     │
                     ▼
             Preview & Confirmation
                     │
                     ▼
          POST /api/extract (Express)
                     │
                     ▼
             Batch Processing (20 rows)
                     │
                     ▼
               Groq (Llama 3.3 70B)
                     │
                     ▼
          Schema Validation (Zod)
                     │
                     ▼
        Business Rule Validation
                     │
                     ▼
   Imported Records / Skipped Records
```

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **AI:** Groq (Llama 3.3 70B) via the OpenAI-compatible SDK
- **Validation:** Zod

## Project Structure

```
ai-crm-importer/
├── backend/
│   └── src/
│       ├── server.ts                    # Express app entry point
│       ├── config/groq.ts               # Groq client setup
│       ├── routes/extract.route.ts      # POST /api/extract
│       ├── services/crmMapper.service.ts# Per-batch AI mapping + validation
│       ├── prompts/crmPrompt.ts         # LLM prompt construction
│       ├── validators/crmRecord.validator.ts # Zod schema + business rules
│       ├── utils/{batch,retry}.ts       # Batching and generic retry helpers
│       └── types/crm.ts                 # Shared CRM record types
└── frontend/
    └── src/
        ├── app/page.tsx                # Single-page upload → preview → results flow
        ├── components/                 # CsvUploader, PreviewTable, ResultsTable, etc.
        ├── lib/api.ts                  # Backend API client
        └── types/crm.ts                # Mirrored CRM record types
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then add your GROQ_API_KEY
npm run dev
```

Runs on `http://localhost:5000`. Verify with:

```bash
curl http://localhost:5000/health
```

Create a `.env` file from `.env.example` and provide your `GROQ_API_KEY`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # NEXT_PUBLIC_API_BASE_URL, defaults to http://localhost:5000
npm run dev
```

Runs on `http://localhost:3000`.

## API Reference

### `POST /api/extract`

Accepts raw, parsed CSV rows (any column names) and returns AI-mapped CRM records.

**Request:**

```json
{ "rows": [{ "Any Column Name": "value", "...": "..." }] }
```

**Response:**

```json
{
  "imported": [
    {
      "created_at": "2026-05-13T14:20:48.000Z",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "GrowEasy",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "lead_owner": "test@gmail.com",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Client is asking to reschedule demo",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    { "row": { "...": "..." }, "reason": "business rule: missing both email and mobile number" }
  ],
  "totalImported": 1,
  "totalSkipped": 1
}
```

Rows are processed in batches (20 rows/batch). Each batch is validated in two stages:

1. **Schema validation** — field types, `crm_status`/`data_source` enum membership, `created_at` date validity
2. **Business rules** — currently: a record must have an `email` or a `mobile_without_country_code`

Records failing either stage are returned in `skipped` with a specific `reason`. A batch that fails to get a usable AI response (after 3 retries) has all of its rows marked skipped, but does not affect other batches.

## Design Decisions

- CSV parsing is performed entirely on the frontend so users can preview their data before any AI processing.
- AI performs semantic field mapping instead of relying on fixed column names, allowing the importer to work with different CSV layouts.
- Records are processed in batches (20 rows) to improve reliability and stay within LLM context limits.
- AI-generated output is validated using Zod before applying business rules to ensure only valid CRM records are imported.
- The application is stateless because persistent storage was not required for the assignment.
