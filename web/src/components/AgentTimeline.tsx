import type { AgentTraceEntry } from "@/types/evaluation";
import { AgentTraceCard } from "@/components/AgentTraceCard";

export function AgentTimeline({ trace }: { trace: AgentTraceEntry[] }) {
  if (trace.length === 0) {
    return <p className="text-sm text-slate-500">No agent trace entries.</p>;
  }

  return (
    <div className="space-y-4">
      {trace.map((entry, index) => (
        <AgentTraceCard key={`${entry.agent_name}-${index}`} entry={entry} step={index + 1} />
      ))}
    </div>
  );
}
