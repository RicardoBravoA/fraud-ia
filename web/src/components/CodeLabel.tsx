import type { CodeLabelInfo } from "@/lib/codeLabels";

interface CodeLabelProps {
  info: CodeLabelInfo;
  /** Show internal code below the label (default: true when label differs from code) */
  showCode?: boolean;
  className?: string;
}

export function CodeLabel({ info, showCode, className = "" }: CodeLabelProps) {
  const showSecondary =
    showCode ?? (info.label !== info.code && info.label.length > 0);

  return (
    <span className={className}>
      <span className="font-medium text-slate-900">{info.label}</span>
      {showSecondary ? (
        <span className="mt-0.5 block text-[11px] text-slate-500">{info.code}</span>
      ) : null}
    </span>
  );
}

export function CodeChip({ info }: { info: CodeLabelInfo }) {
  return (
    <span className="inline-flex flex-col rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-left">
      <span className="text-sm font-medium text-amber-900">{info.label}</span>
      {info.label !== info.code ? (
        <span className="text-[10px] text-amber-700/80">{info.code}</span>
      ) : null}
    </span>
  );
}
