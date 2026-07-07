"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";

type CsvUploaderProps = {
  onParsed: (rows: Record<string, string>[]) => void;
};

export default function CsvUploader({ onParsed }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    setError(null);
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        onParsed(result.data);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <p className="text-sm text-gray-600">
          Drop your CSV file here, or click to browse
        </p>
        {fileName && (
          <p className="mt-2 text-sm font-medium text-gray-900">{fileName}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
