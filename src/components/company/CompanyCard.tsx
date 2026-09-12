import Link from "next/link";
import { AXIS_COLOR } from "@/components/common/AxisBar";
import { SourceBadge } from "@/components/common/SourceBadge";
import { fitTone } from "@/components/common/ScoreHero";
import { buttonVariants } from "@/components/ui/button";
import { AXES, AXIS_LABEL, type Recommendation } from "@/lib/types";
import { cn, signed } from "@/lib/utils";

interface Props {
  rank: number;
  rec: Recommendation;
  currentName: string;
  currentFit: number;
  compact?: boolean;
}

const RANK_STYLE = ["bg-accent text-accent-foreground", "bg-muted text-foreground", "bg-muted text-foreground"];

/** 추천 카드: 적합도 + 이유 + 주의점. 트레이드오프를 같이 보여주는 것이 신뢰를 만든다. */
export function CompanyCard({ rank, rec, currentName, currentFit, compact }: Props) {
  const tone = fitTone(rec.fit.fit);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", RANK_STYLE[rank - 1] ?? RANK_STYLE[2])}>{rank}위</span>
            <span className="truncate text-xs text-muted-foreground">{rec.company.industry}</span>
          </div>
          <h3 className="mt-2 text-xl font-bold leading-tight">{rec.company.name}</h3>
        </div>
        <div className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-full", tone.bg)}>
          <span className={cn("text-2xl font-bold leading-none tabular-nums", tone.text)}>{rec.fit.fit}</span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">적합도</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {currentName} {currentFit}점보다 <span className="font-semibold text-emerald-700 dark:text-emerald-400">{signed(rec.fitDelta)}점</span>
      </div>
    </>
  );

  if (compact) {
    return (
      <Link
        href={`/compare?target=${rec.company.id}`}
        className="flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-soft transition-colors hover:border-primary/50 hover:bg-accent/30"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
      {body}

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {AXES.map((axis) => (
          <div key={axis} className="flex items-center gap-2 text-sm">
            <span className="w-7 text-muted-foreground">{AXIS_LABEL[axis]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", AXIS_COLOR[axis])} style={{ width: `${rec.company.scores[axis]}%` }} />
            </div>
            <span className="w-7 text-right tabular-nums">{rec.company.scores[axis]}</span>
            <SourceBadge source={rec.company.scoreSources[axis]} />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl bg-accent/50 p-4 text-sm leading-relaxed">
        <div>
          <div className="mb-1 text-[13px] font-bold text-accent-foreground">왜 추천했나요?</div>
          {rec.reasons.map((r) => (
            <p key={r}>{r}</p>
          ))}
        </div>
        {rec.cautions.length > 0 ? (
          <div>
            <div className="mb-1 text-[13px] font-bold text-amber-700 dark:text-amber-400">함께 확인해 주세요</div>
            {rec.cautions.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
        ) : null}
      </div>

      <Link href={`/compare?target=${rec.company.id}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "self-start")}>
        지금 회사와 나란히 비교
      </Link>
    </div>
  );
}
