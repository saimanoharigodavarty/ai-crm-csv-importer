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
