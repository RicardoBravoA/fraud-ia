export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-slate-600"
    >
      <span className="animate-pulse">{message}</span>
    </div>
  );
}
