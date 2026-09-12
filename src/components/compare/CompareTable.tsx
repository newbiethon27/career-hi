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

/** 차이는 알약으로. 양수 초록 / 음수 회색 (빨강 X — "나쁨"이 아니라 트레이드오프). */
function DiffPill({ d, suffix = "" }: { d: number | null; suffix?: string }) {
  if (d === null) return <span className="text-muted-foreground">—</span>;
  const cls =
    d > 0
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
      : d < 0
        ? "bg-muted text-muted-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-block min-w-14 rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums", cls)}>
      {d === 0 ? "같음" : `${signed(d)}${suffix}`}
    </span>
  );
}

/** 점수 셀: 두 값 중 높은 쪽을 굵게 + 은은한 배경으로 표시해 승자가 바로 보이게 한다 */
function ScoreCell({ value, win, info }: { value: number; win: boolean; info?: React.ReactNode }) {
  return (
    <td className={cn("px-4 py-3.5 text-right", win && "bg-emerald-50/70 dark:bg-emerald-950/30")}>
      <span className={cn("inline-flex items-center gap-1.5 text-base tabular-nums", win ? "font-bold" : "font-medium text-muted-foreground")}>
        {value}
        {info}
      </span>
    </td>
  );
}

function MetricCell({ label, metric, m, fmt }: { label: string; metric: MetricKey; m: Sourced<number> | null; fmt: (v: number) => string }) {
  return (
    <td className="px-4 py-3.5 text-right">
      {m ? (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {fmt(m.value)} <MetricInfo label={label} metric={metric} m={m} />
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </td>
  );
}

function GroupRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="bg-muted/40">
      <td colSpan={4} className="px-4 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

const metricDiff = (a: Sourced<number> | null, b: Sourced<number> | null) => (a && b ? b.value - a.value : null);

export function CompareTable({ base, baseLabel, target, baseFit, targetFit }: Props) {
  const m1 = base.metrics;
  const m2 = target.metrics;
  const fitDiff = targetFit - baseFit;

  return (
    <div className="overflow-x-auto rounded-3xl border bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground">지표</th>
            <th className="px-4 py-3.5 text-right">
              <div className="text-sm font-bold">{base.name}</div>
              <div className="text-[11px] font-normal text-muted-foreground">{baseLabel}</div>
            </th>
            <th className="px-4 py-3.5 text-right">
              <div className="text-sm font-bold text-primary">{target.name}</div>
              <div className="text-[11px] font-normal text-muted-foreground">비교 회사</div>
            </th>
            <th className="px-4 py-3.5 text-right text-xs font-medium text-muted-foreground">차이</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b bg-accent/40">
            <td className="px-4 py-4">
              <span className="inline-flex items-center gap-1.5 text-base font-bold">
                Fit Score
                <InfoPopover label="Fit 점수 산출 방식 설명" align="left" title="Fit 점수는 이렇게 나왔습니다">
                  {FIT_METHOD}
                </InfoPopover>
              </span>
            </td>
            <td className={cn("px-4 py-4 text-right text-2xl tabular-nums", fitDiff < 0 ? "font-bold" : "font-medium text-muted-foreground")}>{baseFit}</td>
            <td className={cn("px-4 py-4 text-right text-2xl tabular-nums", fitDiff > 0 ? "font-bold text-primary" : "font-medium text-muted-foreground")}>
              {targetFit}
            </td>
            <td className="px-4 py-4 text-right">
              <DiffPill d={fitDiff} />
            </td>
          </tr>

          <GroupRow>내 기준 4축 점수 (100점 만점)</GroupRow>
          {AXES.map((axis) => {
            const d = target.scores[axis] - base.scores[axis];
            return (
              <tr key={axis} className="border-b last:border-0">
                <td className="px-4 py-3.5 font-medium">{AXIS_LABEL[axis]}</td>
                <ScoreCell value={base.scores[axis]} win={d < 0} info={<AxisScoreInfo axis={axis} company={base} />} />
                <ScoreCell value={target.scores[axis]} win={d > 0} info={<AxisScoreInfo axis={axis} company={target} />} />
                <td className="px-4 py-3.5 text-right">
                  <DiffPill d={d} />
                </td>
              </tr>
            );
          })}

          <GroupRow>공시 원본 지표</GroupRow>
          <tr className="border-b">
            <td className="px-4 py-3.5 font-medium">1인 평균 급여액</td>
            <MetricCell label="1인 평균 급여액" metric="avgSalaryManwon" m={m1.avgSalaryManwon} fmt={formatManwon} />
            <MetricCell label="1인 평균 급여액" metric="avgSalaryManwon" m={m2.avgSalaryManwon} fmt={formatManwon} />
            <td className="px-4 py-3.5 text-right">
              {(() => {
                const d = metricDiff(m1.avgSalaryManwon, m2.avgSalaryManwon);
                return <DiffPill d={d === null ? null : Math.round(d / 100) / 100} suffix="억" />;
              })()}
            </td>
          </tr>
          <tr className="border-b">
            <td className="px-4 py-3.5 font-medium">평균 근속연수</td>
            <MetricCell label="평균 근속연수" metric="avgTenureYears" m={m1.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            <MetricCell label="평균 근속연수" metric="avgTenureYears" m={m2.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            <td className="px-4 py-3.5 text-right">
              {(() => {
                const d = metricDiff(m1.avgTenureYears, m2.avgTenureYears);
                return <DiffPill d={d === null ? null : Math.round(d * 10) / 10} suffix="년" />;
              })()}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-3.5 font-medium">직원 수</td>
            <MetricCell label="직원 수" metric="employeeCount" m={m1.employeeCount} fmt={(v) => `${v.toLocaleString("ko-KR")}명`} />
            <MetricCell label="직원 수" metric="employeeCount" m={m2.employeeCount} fmt={(v) => `${v.toLocaleString("ko-KR")}명`} />
            <td className="px-4 py-3.5 text-right text-muted-foreground">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
