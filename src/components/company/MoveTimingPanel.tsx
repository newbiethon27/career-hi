import { DISCLAIMER, MOVE_BAND_META, MOVE_TIMING_WEIGHTS as W } from "@/lib/constants";
import type { MoveTimingResult } from "@/lib/types";
import { cn, formatTenure, signed } from "@/lib/utils";

const BAND_STYLE = {
  stay: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  watch: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  consider: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
} as const;

interface Props {
  result: MoveTimingResult;
  currentFit: number;
  bestFit: number | null;
  tenureMonths: number;
  salaryRatio: number | null; // 사용자 연봉 / 회사 평균 급여
}

/** 점수만 보여주면 블랙박스가 된다 — 4개 구성요소를 항상 함께 노출한다. */
export function MoveTimingPanel({ result, currentFit, bestFit, tenureMonths, salaryRatio }: Props) {
  const gap = bestFit === null ? null : bestFit - currentFit;
  const rows = [
    {
      label: "대안과의 적합도 격차",
      detail: gap === null ? "대안 없음" : `${signed(gap)}점`,
      value: result.components.fitGap,
      max: W.fitGap,
    },
    { label: "현재 회사 적합도", detail: `${currentFit}점`, value: result.components.currentFitPenalty, max: W.currentFitPenalty },
    { label: "근속 기간", detail: formatTenure(tenureMonths), value: result.components.tenureReadiness, max: W.tenureReadiness },
    {
      label: "연봉 위치 (회사 전체 평균 대비)",
      detail: salaryRatio === null ? "데이터 없음" : `평균의 ${Math.round(salaryRatio * 100)}%`,
      value: result.components.salaryGap,
      max: W.salaryGap,
      excluded: result.maxScore < 100 || tenureMonths < 12,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-base font-bold">지금 이직을 검토할 만한가요?</div>
          <div className="mt-0.5 text-xs text-muted-foreground">이직 검토 지수</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums">{result.score}</span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className={cn("rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset", BAND_STYLE[result.band])}>
          {MOVE_BAND_META[result.band].label}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{MOVE_BAND_META[result.band].description}</p>

      <div className="space-y-2 rounded-2xl bg-muted/60 p-4">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 text-sm">
            <span className={cn(r.excluded && "text-muted-foreground line-through")}>{r.label}</span>
            <span className="text-xs text-muted-foreground">{r.detail}</span>
            <span className="w-16 text-right tabular-nums">
              <span className="font-medium">{r.value}</span>
              <span className="text-muted-foreground"> / {r.max}</span>
            </span>
          </div>
        ))}
        {result.notes.map((n) => (
          <p key={n} className="text-xs text-muted-foreground">
            · {n}
          </p>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER.moveTiming}</p>
    </div>
  );
}
