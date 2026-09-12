import { cn } from "@/lib/utils";

/** 80+ 초록 / 60-79 노랑 / <60 주황. "나쁨/좋음" 단어는 쓰지 않는다. */
export function fitTone(score: number): { text: string; ring: string; bg: string; label: string } {
  if (score >= 80)
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      label: "잘 맞는 편",
    };
  if (score >= 60)
    return {
      text: "text-amber-700 dark:text-amber-400",
      ring: "ring-amber-200 dark:ring-amber-800",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      label: "맞는 부분과 아쉬운 부분이 함께",
    };
  return {
    text: "text-orange-700 dark:text-orange-400",
    ring: "ring-orange-200 dark:ring-orange-800",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    label: "내 기준과 거리가 있는 편",
  };
}

interface ScoreHeroProps {
  label: string;
  score: number;
  max?: number;
  sub?: React.ReactNode;
  className?: string;
}

export function ScoreHero({ label, score, max = 100, sub, className }: ScoreHeroProps) {
  const tone = fitTone(score);
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-3xl border bg-card p-6 shadow-soft", className)}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className={cn("flex size-36 flex-col items-center justify-center rounded-full ring-8", tone.bg, tone.ring)}>
        <span className={cn("text-5xl font-bold leading-none tabular-nums tracking-tight", tone.text)}>{score}</span>
        <span className="mt-1 text-xs text-muted-foreground">/ {max}</span>
      </div>
      <div className={cn("text-sm font-semibold", tone.text)}>{tone.label}</div>
      {sub ? <div className="text-center text-sm text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
