import { cn } from "@/lib/utils";

/** 80+ 초록 / 60-79 노랑 / <60 주황. "나쁨/좋음" 단어는 쓰지 않는다. */
export function fitTone(score: number): { text: string; ring: string; bg: string } {
  if (score >= 80) return { text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/40" };
  if (score >= 60) return { text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800", bg: "bg-amber-50 dark:bg-amber-950/40" };
  return { text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-200 dark:ring-orange-800", bg: "bg-orange-50 dark:bg-orange-950/40" };
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
    <div className={cn("flex flex-col items-center gap-2 rounded-2xl p-6 ring-1", tone.bg, tone.ring, className)}>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-6xl font-bold tabular-nums tracking-tight", tone.text)}>{score}</span>
        <span className="text-lg text-muted-foreground">/ {max}</span>
      </div>
      {sub ? <div className="text-center text-sm text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
