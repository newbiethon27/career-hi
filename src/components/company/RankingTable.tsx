"use client";

import Link from "next/link";
import { useState } from "react";
import { AxisScoreInfo } from "@/components/common/AxisScoreInfo";
import { AXIS_COLOR } from "@/components/common/AxisBar";
import { InfoPopover } from "@/components/common/InfoPopover";
import { MetricInfo, type MetricKey } from "@/components/common/MetricInfo";
import { buttonVariants } from "@/components/ui/button";
import { FIT_METHOD } from "@/lib/method";
import { AXES, AXIS_LABEL, type AssessmentResult, type FitResult, type ScoredCompany, type Sourced } from "@/lib/types";
import { cn, formatManwon, signed } from "@/lib/utils";

export interface RankedEntry {
  company: ScoredCompany;
  fit: FitResult;
}

interface Props {
  ranked: RankedEntry[];
  assessment: AssessmentResult;
  baselineLabel: string;
  baselineFit: number;
}

/** 순위표. 행을 누르면 그 회사의 점수 근거를 펼쳐 보여준다 (한 번에 하나). */
export function RankingTable({ ranked, assessment, baselineLabel, baselineFit }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <table className="w-full text-sm">
      <tbody>
        {ranked.map((r) => {
          const open = openId === r.company.id;
          return (
            <FragmentRow
              key={r.company.id}
              entry={r}
              open={open}
              onToggle={() => setOpenId(open ? null : r.company.id)}
              assessment={assessment}
              baselineLabel={baselineLabel}
              baselineFit={baselineFit}
            />
          );
        })}
      </tbody>
    </table>
  );
}

function FragmentRow({
  entry,
  open,
  onToggle,
  assessment,
  baselineLabel,
  baselineFit,
}: {
  entry: RankedEntry;
  open: boolean;
  onToggle: () => void;
  assessment: AssessmentResult;
  baselineLabel: string;
  baselineFit: number;
}) {
  const { company, fit } = entry;
  const delta = fit.fit - baselineFit;

  return (
    <>
      <tr className={cn("border-b last:border-0", open && "bg-muted/40")}>
        <td className="w-10 py-2 pl-5 text-muted-foreground tabular-nums">{fit.rankInPool}</td>
        <td className="py-2">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex w-full cursor-pointer items-center gap-2 text-left hover:underline"
          >
            <span className="font-medium">{company.name}</span>
            <span className="text-xs text-muted-foreground">{company.industry}</span>
            <span className={cn("text-[10px] text-muted-foreground transition-transform", open && "rotate-90")}>▶</span>
          </button>
        </td>
        <td className="py-2 pr-5 text-right font-medium tabular-nums">{fit.fit}</td>
      </tr>

      {open ? (
        <tr className="border-b last:border-0 bg-muted/40">
          <td colSpan={3} className="px-5 pb-5 pt-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Fit <span className="text-sm font-semibold text-foreground tabular-nums">{fit.fit}</span>
                </span>
                <span>
                  · {baselineLabel} {baselineFit} 대비 <span className="font-medium text-foreground">{signed(delta)}</span>
                </span>
                <InfoPopover label="Fit 점수 산출 방식 설명" align="left" title="Fit 점수는 이렇게 나왔습니다">
                  {FIT_METHOD}
                </InfoPopover>
              </div>

              <div className="space-y-2">
                {AXES.map((axis) => (
                  <div key={axis} className="flex items-center gap-2 text-xs">
                    <span className="w-7 shrink-0 text-muted-foreground">{AXIS_LABEL[axis]}</span>
                    <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-muted-foreground/20 sm:w-32">
                      <div className={cn("h-full rounded-full", AXIS_COLOR[axis])} style={{ width: `${company.scores[axis]}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right tabular-nums">{company.scores[axis]}</span>
                    <AxisScoreInfo axis={axis} company={company} align="left" />
                    <span className="text-muted-foreground">
                      내 중요도 {assessment.percent[axis]}% → Fit 기여 {fit.contributions[axis].toFixed(1)}점
                    </span>
                  </div>
                ))}
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                <Metric label="1인 평균 급여액" metric="avgSalaryManwon" m={company.metrics.avgSalaryManwon} fmt={formatManwon} />
                <Metric label="평균 근속연수" metric="avgTenureYears" m={company.metrics.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
                <Metric label="직원 수" metric="employeeCount" m={company.metrics.employeeCount} fmt={(v) => `${v.toLocaleString("ko-KR")}명`} />
              </dl>

              {company.missingAxes.length > 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {company.missingAxes.map((a) => AXIS_LABEL[a]).join("·")} 축은 원본 지표가 없어 비교 대상 회사들의 중앙값으로 채운 값입니다.
                </p>
              ) : null}

              <Link href={`/compare?target=${company.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                지표 자세히 비교 →
              </Link>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Metric({ label, metric, m, fmt }: { label: string; metric: MetricKey; m: Sourced<number> | null; fmt: (v: number) => string }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 tabular-nums">
        {m ? fmt(m.value) : "—"}
        {m ? <MetricInfo label={label} metric={metric} m={m} align="left" /> : null}
      </dd>
    </div>
  );
}
