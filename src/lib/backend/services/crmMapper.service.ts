import { getCerebrasClient, CEREBRAS_MODEL } from "../config/cerebras";
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
    const completion = await getCerebrasClient().chat.completions.create({
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

/**
 * Intelligent local fallback mapper used when Cerebras API is down/rate-limited/times out.
 */
function localHeuristicMap(row: RawRow): CrmRecord {
  const record: CrmRecord = {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
  };

  const keys = Object.keys(row);

  const findValue = (regex: RegExp): string => {
    const key = keys.find((k) => regex.test(k.toLowerCase()));
    return key ? String(row[key] ?? "").trim() : "";
  };

  // 1. Date Formatting
  const rawDate = findValue(/date|created|time|timestamp/);
  if (rawDate) {
    const parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      record.created_at = parsedDate.toISOString();
    } else {
      // Try to parse DD/MM/YYYY manually if it failed
      const parts = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (parts) {
        const day = parts[1].padStart(2, "0");
        const month = parts[2].padStart(2, "0");
        const year = parts[3];
        const dateStr = `${year}-${month}-${day}`;
        if (!isNaN(new Date(dateStr).getTime())) {
          record.created_at = dateStr;
        }
      }
    }
  }

  // Name
  const firstName = findValue(/first.*name/);
  const lastName = findValue(/last.*name/);
  if (firstName || lastName) {
    record.name = `${firstName} ${lastName}`.trim();
  } else {
    record.name = findValue(/name|lead|contact/);
  }

  const extraNotes: string[] = [];

  // 2. Multiple Emails
  const rawEmail = findValue(/email|mail/);
  if (rawEmail) {
    const emailParts = rawEmail.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
    if (emailParts.length > 0) {
      record.email = emailParts[0];
      if (emailParts.length > 1) {
        extraNotes.push(`Additional email: ${emailParts.slice(1).join(", ")}`);
      }
    }
  }

  // 3. Multiple Mobile Numbers & Country Code Splitting
  const rawPhone = findValue(/phone|mobile|contact|cell|number/);
  if (rawPhone) {
    const phoneParts = rawPhone.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
    if (phoneParts.length > 0) {
      let firstPhone = phoneParts[0];
      // Normalize and split country code
      // Match starts with +, followed by 1 to 3 digits country code, followed by number
      const countryCodeMatch = firstPhone.match(/^(\+\d{1,3})[\s\-]?(\d{7,15})$/);
      if (countryCodeMatch) {
        record.country_code = countryCodeMatch[1];
        record.mobile_without_country_code = countryCodeMatch[2];
      } else if (firstPhone.startsWith("+")) {
        // Fallback for custom code lengths
        const codeMatch = firstPhone.match(/^(\+\d{1,3})(.*)$/);
        if (codeMatch) {
          record.country_code = codeMatch[1];
          record.mobile_without_country_code = codeMatch[2].replace(/[^\d]/g, "");
        } else {
          record.mobile_without_country_code = firstPhone.replace(/[^\d]/g, "");
        }
      } else {
        record.mobile_without_country_code = firstPhone.replace(/[^\d]/g, "");
      }

      if (phoneParts.length > 1) {
        extraNotes.push(`Additional mobile: ${phoneParts.slice(1).join(", ")}`);
      }
    }
  }

  // Demographics / Metadata
  record.company = findValue(/company|organization|org|firm/);
  record.city = findValue(/city/);
  record.state = findValue(/state|region/);
  record.country = findValue(/country/);
  record.lead_owner = findValue(/owner|assignee|agent/);

  // Notes
  const baseNote = findValue(/note|comment|remark/);
  const allNotes = [baseNote, ...extraNotes].filter(Boolean);
  record.crm_note = allNotes.join(". ");

  // 4. CRM Status Inference
  const rawStatus = findValue(/status|stage/).toUpperCase();
  const searchText = `${rawStatus} ${record.crm_note} ${findValue(/desc|info/)}`.toLowerCase();
  
  if (searchText.includes("demo") || searchText.includes("interested") || searchText.includes("follow up")) {
    record.crm_status = "GOOD_LEAD_FOLLOW_UP";
  } else if (searchText.includes("not connect") || searchText.includes("busy") || searchText.includes("no response") || searchText.includes("no contact") || searchText.includes("call back")) {
    record.crm_status = "DID_NOT_CONNECT";
  } else if (searchText.includes("not interested") || searchText.includes("bad") || searchText.includes("spam") || searchText.includes("junk") || searchText.includes("wrong number")) {
    record.crm_status = "BAD_LEAD";
  } else if (searchText.includes("deal closed") || searchText.includes("sale done") || searchText.includes("won") || searchText.includes("payment") || searchText.includes("onboarding")) {
    record.crm_status = "SALE_DONE";
  } else {
    record.crm_status = "";
  }

  // Data Source Enum
  const sourceStr = findValue(/source|medium|campaign/).toLowerCase();
  if (sourceStr.includes("demand")) {
    record.data_source = "leads_on_demand";
  } else if (sourceStr.includes("tower") || sourceStr.includes("meridian")) {
    record.data_source = "meridian_tower";
  } else if (sourceStr.includes("park") || sourceStr.includes("eden")) {
    record.data_source = "eden_park";
  } else if (sourceStr.includes("swamy") || sourceStr.includes("varah")) {
    record.data_source = "varah_swamy";
  } else if (sourceStr.includes("plot") || sourceStr.includes("sarjapur")) {
    record.data_source = "sarjapur_plots";
  } else {
    record.data_source = "";
  }

  record.possession_time = findValue(/possession/);
  record.description = findValue(/desc|info/);

  return record;
}

export async function processBatch(batch: RawRow[]): Promise<BatchResult> {
  const prompt = buildPrompt(batch);

  let candidates: unknown[];
  try {
    console.log(`Processing batch of size ${batch.length} using Cerebras LLM...`);
    candidates = await retry(async () => {
      const rawText = await callCerebras(prompt);
      return parseResponse(rawText, batch.length);
    });
  } catch (err) {
    console.error("Cerebras mapping failed, falling back to local heuristic mapper. Error:", err);
    // Graceful fallback to heuristic local mapper
    candidates = batch.map((row) => localHeuristicMap(row));
  }

  const { imported, skipped } = validateRecords(candidates, batch);
  return buildBatchResult(imported, skipped);
}
