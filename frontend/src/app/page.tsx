"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import PreviewTable from "@/components/PreviewTable";
import ResultsTable from "@/components/ResultsTable";
import StepIndicator from "@/components/StepIndicator";
import ProcessingStatus from "@/components/ProcessingStatus";
import { extractCrmRecords } from "@/lib/api";
import type { ExtractResponse } from "@/types/crm";

export default function Home() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<ExtractResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = results
    ? "results"
    : isProcessing
      ? "processing"
      : rows.length > 0
        ? "preview"
        : "upload";

  const handleParsed = (parsedRows: Record<string, string>[]) => {
    setRows(parsedRows);
    setResults(null);
    setError(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await extractCrmRecords(rows);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <main className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          AI-Powered CRM CSV Importer
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a CSV file to preview and intelligently map leads into a
          standardized CRM format.
        </p>

        <div className="mt-6">
          <StepIndicator currentStep={currentStep} />
        </div>

        <div className="mt-8">
          <CsvUploader onParsed={handleParsed} />
        </div>

        {rows.length > 0 && !isProcessing && !results && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-medium text-gray-900">
              Preview ({rows.length} rows)
            </h2>
            <PreviewTable rows={rows} />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Confirm Import
              </button>
            </div>
          </div>
        )}

        {isProcessing && <ProcessingStatus />}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {results && (
          <ResultsTable
            imported={results.imported}
            skipped={results.skipped}
            totalImported={results.totalImported}
            totalSkipped={results.totalSkipped}
          />
        )}
      </main>
    </div>
  );
}
