export function ErrorState({ error }: { error: Error | unknown }) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"
    >
      <h2 className="font-semibold">Error</h2>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}
