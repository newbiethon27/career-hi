import { AxisScoreInfo } from "@/components/common/AxisScoreInfo";
import { InfoPopover } from "@/components/common/InfoPopover";
import { MetricInfo, type MetricKey } from "@/components/common/MetricInfo";
import { FIT_METHOD } from "@/lib/method";
import { AXES, AXIS_LABEL, type ScoredCompany, type Sourced } from "@/lib/types";
import { cn, formatManwon, signed } from "@/lib/utils";

interface Props {
  base: ScoredCompany;
  /** 왼쪽 열 라벨 — 재직자는 "현재", 구직자는 "업계 평균" */
  baseLabel: string;
  target: ScoredCompany;
  baseFit: number;
  targetFit: number;
}

/** 차이 컬럼: 양수 초록 / 음수 회색 (빨강 X — "나쁨"이 아니라 트레이드오프). */
function Diff({ d, suffix = "" }: { d: number | null; suffix?: string }) {
  if (d === null) return <span className="text-muted-foreground">—</span>;
  const cls = d > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : d < 0 ? "text-muted-foreground" : "text-muted-foreground";
  return (
    <span className={cn("tabular-nums", cls)}>
      {signed(d)}
      {suffix}
    </span>
  );
}

function Cell({ label, metric, m, fmt }: { label: string; metric: MetricKey; m: Sourced<number> | null; fmt: (v: number) => string }) {
  if (!m) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {fmt(m.value)} <MetricInfo label={label} metric={metric} m={m} />
    </span>
  );
}

const metricDiff = (a: Sourced<number> | null, b: Sourced<number> | null) => (a && b ? b.value - a.value : null);

export function CompareTable({ base, baseLabel, target, baseFit, targetFit }: Props) {
  const m1 = base.metrics;
  const m2 = target.metrics;
  return (
    <div className="overflow-x-auto rounded-3xl border bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">지표</th>
            <th className="px-4 py-3 text-right font-medium">
              {base.name} <span className="font-normal">({baseLabel})</span>
            </th>
            <th className="px-4 py-3 text-right font-medium">{target.name}</th>
            <th className="px-4 py-3 text-right font-medium">차이</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t bg-accent/50 font-semibold">
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5">
                Fit Score
                <InfoPopover label="Fit 점수 산출 방식 설명" align="left" title="Fit 점수는 이렇게 나왔습니다">
                  {FIT_METHOD}
                </InfoPopover>
              </span>
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{baseFit}</td>
            <td className="px-4 py-3 text-right tabular-nums">{targetFit}</td>
            <td className="px-4 py-3 text-right">
              <Diff d={targetFit - baseFit} />
            </td>
          </tr>
          {AXES.map((axis) => (
            <tr key={axis} className="border-t">
              <td className="px-4 py-3">{AXIS_LABEL[axis]}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  {base.scores[axis]} <AxisScoreInfo axis={axis} company={base} />
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  {target.scores[axis]} <AxisScoreInfo axis={axis} company={target} />
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Diff d={target.scores[axis] - base.scores[axis]} />
              </td>
            </tr>
          ))}
          <tr className="border-t border-t-2">
            <td className="px-4 py-3">1인 평균 급여액</td>
            <td className="px-4 py-3 text-right">
              <Cell label="1인 평균 급여액" metric="avgSalaryManwon" m={m1.avgSalaryManwon} fmt={formatManwon} />
            </td>
            <td className="px-4 py-3 text-right">
              <Cell label="1인 평균 급여액" metric="avgSalaryManwon" m={m2.avgSalaryManwon} fmt={formatManwon} />
            </td>
            <td className="px-4 py-3 text-right">
              {(() => {
                const d = metricDiff(m1.avgSalaryManwon, m2.avgSalaryManwon);
                return d === null ? <Diff d={null} /> : <Diff d={Math.round(d / 100) / 100} suffix="억" />;
              })()}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-4 py-3">평균 근속연수</td>
            <td className="px-4 py-3 text-right">
              <Cell label="평균 근속연수" metric="avgTenureYears" m={m1.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            </td>
            <td className="px-4 py-3 text-right">
              <Cell label="평균 근속연수" metric="avgTenureYears" m={m2.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            </td>
            <td className="px-4 py-3 text-right">
              {(() => {
                const d = metricDiff(m1.avgTenureYears, m2.avgTenureYears);
                return d === null ? <Diff d={null} /> : <Diff d={Math.round(d * 10) / 10} suffix="년" />;
              })()}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-4 py-3">직원 수</td>
            <td className="px-4 py-3 text-right">
              <Cell label="직원 수" metric="employeeCount" m={m1.employeeCount} fmt={(v) => `${v.toLocaleString("ko-KR")}명`} />
            </td>
            <td className="px-4 py-3 text-right">
              <Cell label="직원 수" metric="employeeCount" m={m2.employeeCount} fmt={(v) => `${v.toLocaleString("ko-KR")}명`} />
            </td>
            <td className="px-4 py-3 text-right text-muted-foreground">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
