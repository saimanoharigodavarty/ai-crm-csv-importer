# AI-Powered CRM CSV Importer

An AI-assisted CSV importer that maps leads from any CSV layout (Facebook lead exports, Google Ads exports, manual spreadsheets, other CRM exports, etc.) into a standard CRM record format — without assuming fixed column names.

Upload a CSV, preview the parsed data, confirm the import, and let an LLM (Cerebras) intelligently map arbitrary CSV columns into a standardized CRM schema. The extracted records are validated before being returned as imported or skipped with clear reasons.

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
          POST /api/extract (Next.js Route Handler)
                     │
                     ▼
             Batch Processing (20 rows)
                     │
                     ▼
          Cerebras (gpt-oss-120b, OpenAI-compatible API)
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

The app is a single Next.js project — the UI and the API route both live in the same deployment, there is no separate backend service.

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **AI:** Cerebras (`gpt-oss-120b`) via the OpenAI-compatible SDK
- **Validation:** Zod
- **CSV parsing:** PapaParse

## Project Structure

```
ai-crm-csv-importer/
└── src/
    ├── app/
    │   ├── page.tsx                     # Single-page upload → preview → results flow
    │   └── api/
    │       ├── extract/route.ts         # POST /api/extract
    │       └── health/route.ts          # GET /api/health
    ├── components/                      # CsvUploader, PreviewTable, ResultsTable, ProcessingStatus, StepIndicator
    ├── lib/
    │   ├── api.ts                       # Frontend → /api/extract client
    │   └── backend/
    │       ├── config/cerebras.ts       # Cerebras client setup
    │       ├── prompts/crmPrompt.ts     # LLM prompt construction
    │       ├── services/crmMapper.service.ts # Per-batch AI mapping + validation
    │       ├── validators/crmRecord.validator.ts # Zod schema + business rules
    │       ├── utils/{batch,retry}.ts   # Batching and generic retry helpers
    │       └── types/crm.ts             # Shared CRM record types
    └── types/crm.ts                     # Frontend-facing CRM record types
```

## Setup

```bash
npm install
cp .env.example .env   # then add your CEREBRAS_API_KEY
npm run dev
```

Runs on `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/api/health
```

### Getting a Cerebras API key

1. Sign up / log in at [cloud.cerebras.ai](https://cloud.cerebras.ai)
2. Generate an API key from the dashboard
3. Add it to `.env` as `CEREBRAS_API_KEY`

This is the only environment variable the app needs.

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

Records failing either stage are returned in `skipped` with a specific reason. A batch that fails to get a usable AI response (after 3 retries, exponential backoff) has all of its rows marked skipped, but does not affect other batches.

### `GET /api/health`

Returns `{ "status": "ok" }`. Useful for uptime checks.

## Design Decisions

- CSV parsing is performed entirely on the frontend so users can preview their data before any AI processing.
- AI performs semantic field mapping instead of relying on fixed column names, allowing the importer to work with different CSV layouts.
- Records are processed in batches (20 rows) to improve reliability and stay within LLM context limits.
- AI-generated output is validated using Zod before applying business rules to ensure only valid CRM records are imported.
- The application is stateless because persistent storage was not required for the assignment.
