import type { ExtractResponse } from "@/types/crm";

const EXTRACT_URL = "/api/extract";

export async function extractCrmRecords(
  rows: Record<string, string>[]
): Promise<ExtractResponse> {
  const res = await fetch(EXTRACT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    throw new Error(`Extraction failed with status ${res.status}`);
  }

  return res.json();
}
