import { cerebrasClient, CEREBRAS_MODEL } from "../config/cerebras";
import { buildCrmExtractionPrompt } from "../prompts/crmPrompt";
import { retry } from "../utils/retry";
import { validateSchema, validateBusinessRules } from "../validators/crmRecord.validator";
import type { CrmRecord, RawRow, SkippedRecord } from "../types/crm";

type BatchResult = {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
};

function buildPrompt(batch: RawRow[]): string {
  return buildCrmExtractionPrompt(batch);
}

async function callCerebras(prompt: string): Promise<string> {
  try {
    const completion = await cerebrasClient.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("Cerebras response had no content");
    }

    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Cerebras request failed: ${message}`);
  }
}

function parseResponse(rawText: string, expectedLength: number): unknown[] {
  const cleaned = rawText.trim().replace(/^```json\s*|```$/g, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Cerebras response was not valid JSON");
  }

  if (!Array.isArray(parsed) || parsed.length !== expectedLength) {
    throw new Error(
      `Expected an array of ${expectedLength} records, got ${
        Array.isArray(parsed) ? parsed.length : typeof parsed
      }`
    );
  }

  return parsed;
}

function validateRecords(candidates: unknown[], originalRows: RawRow[]): BatchResult {
  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  candidates.forEach((candidate, index) => {
    const originalRow = originalRows[index];

    const schemaResult = validateSchema(candidate);
    if (!schemaResult.success) {
      skipped.push({ row: originalRow, reason: schemaResult.reason });
      return;
    }

    const businessResult = validateBusinessRules(schemaResult.data);
    if (!businessResult.valid) {
      skipped.push({ row: originalRow, reason: businessResult.reason });
      return;
    }

    imported.push(schemaResult.data);
  });

  return { imported, skipped };
}

function buildBatchResult(imported: CrmRecord[], skipped: SkippedRecord[]): BatchResult {
  return { imported, skipped };
}

export async function processBatch(batch: RawRow[]): Promise<BatchResult> {
  const prompt = buildPrompt(batch);

  let candidates: unknown[];
  try {
    candidates = await retry(async () => {
      const rawText = await callCerebras(prompt);
      return parseResponse(rawText, batch.length);
    });
  } catch (err) {
    console.error("processBatch failed:", err);
    const reason = err instanceof Error ? err.message : "AI processing failed after retries";
    const skipped: SkippedRecord[] = batch.map((row) => ({
      row,
      reason,
    }));
    return buildBatchResult([], skipped);
  }

  const { imported, skipped } = validateRecords(candidates, batch);
  return buildBatchResult(imported, skipped);
}
