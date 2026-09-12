import Link from "next/link";
import { AXIS_COLOR } from "@/components/common/AxisBar";
import { AxisScoreInfo } from "@/components/common/AxisScoreInfo";
import { fitTone } from "@/components/common/ScoreHero";
import { buttonVariants } from "@/components/ui/button";
import { AXES, AXIS_LABEL, type Recommendation } from "@/lib/types";
import { cn, signed } from "@/lib/utils";

interface Props {
  rank: number;
  rec: Recommendation;
  /** 비교 기준 이름 — 재직자는 현재 회사, 구직자는 업계 평균 */
  baselineName: string;
  baselineFit: number;
  compact?: boolean;
}

/** 추천 카드: Fit + 이유 + 주의점. 트레이드오프를 같이 보여주는 것이 신뢰를 만든다. */
export function CompanyCard({ rank, rec, baselineName, baselineFit, compact }: Props) {
  const tone = fitTone(rec.fit.fit);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            {rank}위 · {rec.company.industry}
          </div>
          <h3 className="text-xl font-semibold">{rec.company.name}</h3>
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-bold tabular-nums", tone.text)}>{rec.fit.fit}</div>
          <div className="text-xs text-muted-foreground">
            {baselineName} {baselineFit} 대비 <span className="font-medium text-foreground">{signed(rec.fitDelta)}</span>
          </div>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {AXES.map((axis) => (
              <div key={axis} className="flex items-center gap-2 text-sm">
                <span className="w-7 text-muted-foreground">{AXIS_LABEL[axis]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", AXIS_COLOR[axis])} style={{ width: `${rec.company.scores[axis]}%` }} />
                </div>
                <span className="w-7 text-right tabular-nums">{rec.company.scores[axis]}</span>
                <AxisScoreInfo axis={axis} company={rec.company} />
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            {rec.reasons.map((r) => (
              <p key={r} className="flex gap-2">
                <span className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">✓ 추천 이유</span>
                <span>{r}</span>
              </p>
            ))}
            {rec.cautions.map((c) => (
              <p key={c} className="flex gap-2">
                <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">△ 함께 확인</span>
                <span>{c}</span>
              </p>
            ))}
          </div>

          <Link href={`/compare?target=${rec.company.id}`} className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
            지표 자세히 비교 →
          </Link>
        </>
      ) : null}
    </div>
  );
}
