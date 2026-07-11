type PreviewTableProps = {
  rows: Record<string, string>[];
};

export default function PreviewTable({ rows }: PreviewTableProps) {
  if (rows.length === 0) return null;

  const headers = Object.keys(rows[0]);

  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 even:bg-gray-50">
              {headers.map((header) => (
                <td key={header} className="whitespace-nowrap px-4 py-2 text-gray-800">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
