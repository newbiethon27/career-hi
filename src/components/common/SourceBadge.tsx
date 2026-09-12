import { cn } from "@/lib/utils";
import type { DataSource } from "@/lib/types";

const META: Record<DataSource, { label: string; className: string; title: string }> = {
  dart: {
    label: "DART",
    className: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
    title: "금융감독원 전자공시(DART) 사업보고서 기준 실데이터",
  },
  manual: {
    label: "데모 추정치",
    className: "bg-muted text-muted-foreground ring-border",
    title: "공공데이터가 없어 서비스가 수동으로 입력한 추정치",
  },
  derived: {
    label: "추정",
    className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
    title: "원본 지표가 없어 유니버스 중앙값으로 보간한 값",
  },
};

export function SourceBadge({ source, asOf, className }: { source: DataSource; asOf?: string; className?: string }) {
  const m = META[source];
  return (
    <span
      title={m.title}
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[10px] font-medium ring-1 ring-inset",
        m.className,
        className,
      )}
    >
      {m.label}
      {source === "dart" && asOf ? ` ${asOf}` : null}
    </span>
  );
}
