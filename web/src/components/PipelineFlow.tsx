import { AGENT_DEFINITIONS, PIPELINE_PHASES } from "@/lib/pipelineAgents";
import type { AgentTraceEntry } from "@/types/evaluation";

const PHASE_COLORS: Record<string, string> = {
  analysis: "border-blue-200 bg-blue-50 text-blue-900",
  intelligence: "border-violet-200 bg-violet-50 text-violet-900",
  synthesis: "border-amber-200 bg-amber-50 text-amber-900",
  decision: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

interface PipelineFlowProps {
  trace: AgentTraceEntry[];
}

export function PipelineFlow({ trace }: PipelineFlowProps) {
  const completed = new Set(trace.map((t) => t.agent_name));

  return (
    <div className="space-y-6">
      {PIPELINE_PHASES.map((phase) => {
        const agents = Object.values(AGENT_DEFINITIONS).filter((a) => a.phase === phase.id);
        return (
          <div key={phase.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h4 className="font-semibold text-slate-900">{phase.label}</h4>
              <p className="mt-1 text-sm text-slate-600">{phase.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent, index) => {
                const done = completed.has(agent.name);
                return (
                  <div key={agent.name} className="flex items-center gap-2">
                    <div
                      className={[
                        "rounded-lg border px-3 py-2 text-xs font-medium transition",
                        done
                          ? PHASE_COLORS[phase.id]
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      ].join(" ")}
                      title={agent.description}
                    >
                      <span className="block font-semibold">{agent.shortLabel}</span>
                      <span className="block text-[10px] opacity-80">{agent.role}</span>
                    </div>
                    {index < agents.length - 1 ? (
                      <span className="text-slate-300" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
