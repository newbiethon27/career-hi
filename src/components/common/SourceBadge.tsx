import { SOURCE_NOTE } from "@/lib/method";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/lib/types";

const CLASS: Record<DataSource, string> = {
  dart: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  manual: "bg-muted text-muted-foreground ring-border",
  derived: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
};

export function SourceBadge({ source, asOf, className }: { source: DataSource; asOf?: string; className?: string }) {
  const m = SOURCE_NOTE[source];
  return (
    <span
      title={m.note}
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset",
        CLASS[source],
        className,
      )}
    >
      {m.label}
      {source === "dart" && asOf ? ` ${asOf}` : null}
    </span>
  );
}
