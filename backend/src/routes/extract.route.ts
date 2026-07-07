import { Router } from "express";
import { chunk } from "../utils/batch";
import { processBatch } from "../services/crmMapper.service";
import type { CrmRecord, ExtractResponse, RawRow, SkippedRecord } from "../types/crm";

const BATCH_SIZE = 20;

const router = Router();

router.post("/extract", async (req, res) => {
  const rows: RawRow[] = req.body?.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'rows' array." });
  }

  const batches = chunk(rows, BATCH_SIZE);

  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (const batch of batches) {
    const result = await processBatch(batch);
    imported.push(...result.imported);
    skipped.push(...result.skipped);
  }

  const response: ExtractResponse = {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };

  res.json(response);
});

export default router;
