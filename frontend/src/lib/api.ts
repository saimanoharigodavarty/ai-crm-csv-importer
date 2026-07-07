import type { ExtractResponse } from "@/types/crm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function extractCrmRecords(
  rows: Record<string, string>[]
): Promise<ExtractResponse> {
  const res = await fetch(`${API_BASE_URL}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    throw new Error(`Extraction failed with status ${res.status}`);
  }

  return res.json();
}
