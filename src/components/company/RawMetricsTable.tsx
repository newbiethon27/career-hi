import { MetricInfo, type MetricKey } from "@/components/common/MetricInfo";
import { DISCLAIMER } from "@/lib/constants";
import type { ScoredCompany, Sourced } from "@/lib/types";
import { formatManwon } from "@/lib/utils";

function Row({
  label,
  metric,
  m,
  fmt,
}: {
  label: string;
  metric: MetricKey;
  m: Sourced<number> | null;
  fmt: (v: number) => string;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4 text-muted-foreground">{label}</td>
      <td className="py-2 pr-4 text-right tabular-nums">{m ? fmt(m.value) : "—"}</td>
      <td className="py-2">
        {m ? <MetricInfo label={label} metric={metric} m={m} /> : <span className="text-xs text-muted-foreground">데이터 없음</span>}
      </td>
    </tr>
  );
}

const fmtNum = (v: number) => v.toLocaleString("ko-KR");
const fmtEok = (v: number) => `${(v / 100).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억원`; // 백만원 → 억원

/** 원본 지표 표. 수치 옆 "?" 를 누르면 출처·기준시점·집계 방식이 열린다. */
export function RawMetricsTable({ company }: { company: ScoredCompany }) {
  const m = company.metrics;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <Row label="1인 평균 급여액" metric="avgSalaryManwon" m={m.avgSalaryManwon} fmt={formatManwon} />
            <Row label="평균 근속연수" metric="avgTenureYears" m={m.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            <Row label="직원 수" metric="employeeCount" m={m.employeeCount} fmt={(v) => `${fmtNum(v)}명`} />
            <Row label="직원 수 (전기)" metric="employeeCountPrev" m={m.employeeCountPrev} fmt={(v) => `${fmtNum(v)}명`} />
            <Row label="매출액" metric="revenue" m={m.revenue} fmt={fmtEok} />
            <Row label="매출액 (전기)" metric="revenuePrev" m={m.revenuePrev} fmt={fmtEok} />
            <Row label="영업이익" metric="operatingProfit" m={m.operatingProfit} fmt={fmtEok} />
            <Row label="영업이익 (전기)" metric="operatingProfitPrev" m={m.operatingProfitPrev} fmt={fmtEok} />
            <Row label="워라밸 지표" metric="worklifeIndex" m={m.worklifeIndex} fmt={(v) => `${v} / 100`} />
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER.averages}</p>
    </div>
  );
}
