import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { chunk } from "../../../lib/backend/utils/batch";
import { processBatch } from "../../../lib/backend/services/crmMapper.service";
import type { CrmRecord, ExtractResponse, RawRow, SkippedRecord } from "../../../lib/backend/types/crm";

const BATCH_SIZE = 20;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: RawRow[] = body?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'rows' array." },
        { status: 400 }
      );
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred during extraction." },
      { status: 500 }
    );
  }
}
