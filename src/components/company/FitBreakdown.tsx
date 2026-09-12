import { AXIS_COLOR } from "@/components/common/AxisBar";
import { SourceBadge } from "@/components/common/SourceBadge";
import { sortAxesByScore } from "@/lib/assessment";
import { AXIS_LABEL, type AssessmentResult, type ScoredCompany } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "내 중요도 vs 회사 점수" 이중 막대. 내가 중시하는 축에서 회사 점수가 낮은 것이 한눈에 보여야 한다.
 * 정렬은 사용자 중요도 순.
 */
export function FitBreakdown({ assessment, company }: { assessment: AssessmentResult; company: ScoredCompany }) {
  const order = sortAxesByScore(assessment.raw);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-4 text-xs text-muted-foreground">
        <span />
        <span>내 중요도</span>
        <span>회사 점수</span>
      </div>
      {order.map((axis, i) => {
        const pct = assessment.percent[axis];
        const score = company.scores[axis];
        return (
          <div key={axis} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-x-4">
            <span className={cn("text-sm", i === 0 ? "font-semibold" : "text-muted-foreground")}>{AXIS_LABEL[axis]}</span>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full opacity-60", AXIS_COLOR[axis])} style={{ width: `${(pct / 50) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-sm tabular-nums">{pct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", AXIS_COLOR[axis])} style={{ width: `${score}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-medium tabular-nums">{score}</span>
              <SourceBadge source={company.scoreSources[axis]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
