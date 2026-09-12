import { AXIS_COLOR } from "@/components/common/AxisBar";
import { AxisScoreInfo } from "@/components/common/AxisScoreInfo";
import { sortAxesByScore } from "@/lib/assessment";
import { AXIS_LABEL, type AssessmentResult, type ScoredCompany } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_CHIP = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
];

/**
 * "내 중요도 vs 회사 점수". 막대는 회사 점수 하나만 그리고, 내 중요도는 왼쪽 순위 칩으로 보여준다.
 * 위에 있을수록 내가 중요하게 보는 기준 — 위쪽 막대가 짧으면 그만큼 적합도가 내려간다.
 */
export function FitBreakdown({ assessment, company }: { assessment: AssessmentResult; company: ScoredCompany }) {
  const order = sortAxesByScore(assessment.raw);
  return (
    <div className="space-y-3">
      {order.map((axis, i) => {
        const pct = assessment.percent[axis];
        const score = company.scores[axis];
        return (
          <div key={axis} className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3 sm:grid-cols-[8rem_1fr]">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", i === 0 ? "font-bold" : "font-medium")}>{AXIS_LABEL[axis]}</span>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", PRIORITY_CHIP[i])}>{pct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-[width] duration-500", AXIS_COLOR[axis])} style={{ width: `${score}%` }} />
              </div>
              <span className={cn("w-8 text-right text-sm tabular-nums", i === 0 ? "font-bold" : "font-medium")}>{score}</span>
              <AxisScoreInfo axis={axis} company={company} />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-muted-foreground">칩의 %는 내가 각 기준에 둔 비중, 막대는 회사 점수(100점 만점)입니다. 위쪽 막대가 짧을수록 적합도가 내려갑니다.</p>
    </div>
  );
}
