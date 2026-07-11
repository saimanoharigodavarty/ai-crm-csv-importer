import type { CrmRecord, SkippedRecord } from "@/types/crm";

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-blue-100 text-blue-700",
  DID_NOT_CONNECT: "bg-gray-100 text-gray-600",
  BAD_LEAD: "bg-red-100 text-red-700",
  SALE_DONE: "bg-green-100 text-green-700",
};

function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-gray-400">—</span>;

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

const CRM_COLUMNS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

type ResultsTableProps = {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
};

export default function ResultsTable({
  imported,
  skipped,
  totalImported,
  totalSkipped,
}: ResultsTableProps) {
  return (
    <div className="mt-8 space-y-8">
      <div className="flex gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white">
            ✓
          </span>
          <div>
            <p className="text-xs text-green-700">Total Imported</p>
            <p className="text-xl font-semibold text-green-800">{totalImported}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">
            ✕
          </span>
          <div>
            <p className="text-xs text-red-700">Total Skipped</p>
            <p className="text-xl font-semibold text-red-800">{totalSkipped}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Imported Records
        </h2>
        <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                {CRM_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imported.map((record, i) => (
                <tr key={i} className="border-t border-gray-100 even:bg-gray-50">
                  {CRM_COLUMNS.map((col) => (
                    <td key={col} className="whitespace-nowrap px-4 py-2 text-gray-800">
                      {col === "crm_status" ? (
                        <StatusBadge status={record[col]} />
                      ) : (
                        record[col]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {skipped.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-medium text-gray-900">
            Skipped Records
          </h2>
          <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700">
                    Original Row
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100 even:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-red-700">{item.reason}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                      {JSON.stringify(item.row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
