"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import PreviewTable from "@/components/PreviewTable";

export default function Home() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <main className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          AI CRM Importer
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a CSV file to preview and import leads.
        </p>

        <div className="mt-8">
          <CsvUploader onParsed={setRows} />
        </div>

        {rows.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-medium text-gray-900">
              Preview ({rows.length} rows)
            </h2>
            <PreviewTable rows={rows} />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirm Import
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
