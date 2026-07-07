export default function ProcessingStatus() {
  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-8 text-center">
      <p className="text-sm font-semibold text-blue-600">
        🤖 AI Processing
      </p>

      <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-1/3 rounded-full bg-blue-600 animate-indeterminate" />
      </div>

      <ul className="mt-5 space-y-1 text-sm text-gray-500">
        <li>Sending batches to Groq</li>
        <li>Mapping CRM fields</li>
        <li>Validating results</li>
      </ul>
      <p className="mt-3 text-xs text-gray-400">This may take a few seconds.</p>
    </div>
  );
}
