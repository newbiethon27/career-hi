import { cn } from "@/lib/utils";
import { AXIS_LABEL, type Axis } from "@/lib/types";

export const AXIS_COLOR: Record<Axis, string> = {
  compensation: "bg-amber-500",
  balance: "bg-emerald-500",
  stability: "bg-sky-500",
  growth: "bg-violet-500",
};

interface AxisBarProps {
  axis: Axis;
  value: number; // 0..100
  max?: number; // 막대 폭 기준 (percent 표시엔 50이 자연스럽다)
  suffix?: string;
  highlight?: boolean;
  right?: React.ReactNode;
  className?: string;
}

/** 축 1개 가로 막대. Recharts 없이 div width% — 빠르고 깨지지 않는다. */
export function AxisBar({ axis, value, max = 100, suffix = "", highlight, right, className }: AxisBarProps) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("w-8 shrink-0 text-sm", highlight ? "font-semibold" : "text-muted-foreground")}>
        {AXIS_LABEL[axis]}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", AXIS_COLOR[axis])}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={cn("w-12 shrink-0 text-right text-sm tabular-nums", highlight && "font-semibold")}>
        {value}
        {suffix}
      </span>
      {right}
    </div>
  );
}
