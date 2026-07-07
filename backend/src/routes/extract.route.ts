import { Router } from "express";
import { chunk } from "../utils/batch";
import type { CrmRecord, ExtractResponse, RawRow } from "../types/crm";

const BATCH_SIZE = 20;

const router = Router();

// TEMPORARY: returns one dummy record per batch, no real mapping yet.
// Proves the request -> batching -> response plumbing works end to end
// before Gemini integration is added in the next commit.
function dummyMapBatch(batch: RawRow[]): CrmRecord {
  return {
    created_at: new Date().toISOString(),
    name: "Dummy User",
    email: "dummy@example.com",
    country_code: "+91",
    mobile_without_country_code: "9999999999",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: `Generated from a batch of ${batch.length} row(s)`,
    data_source: "",
    possession_time: "",
    description: "",
  };
}

router.post("/extract", (req, res) => {
  const rows: RawRow[] = req.body?.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'rows' array." });
  }

  const batches = chunk(rows, BATCH_SIZE);
  const imported: CrmRecord[] = batches.map(dummyMapBatch);

  const response: ExtractResponse = {
    imported,
    skipped: [],
    totalImported: imported.length,
    totalSkipped: 0,
  };

  res.json(response);
});

export default router;
