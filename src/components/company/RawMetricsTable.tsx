import { SourceBadge } from "@/components/common/SourceBadge";
import { DISCLAIMER } from "@/lib/constants";
import type { ScoredCompany, Sourced } from "@/lib/types";
import { formatManwon } from "@/lib/utils";

function Row({ label, m, fmt }: { label: string; m: Sourced<number> | null; fmt: (v: number) => string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4 text-muted-foreground">{label}</td>
      <td className="py-2 pr-4 text-right tabular-nums">{m ? fmt(m.value) : "—"}</td>
      <td className="py-2">{m ? <SourceBadge source={m.source} asOf={m.asOf} /> : <span className="text-xs text-muted-foreground">데이터 없음</span>}</td>
    </tr>
  );
}

const fmtNum = (v: number) => v.toLocaleString("ko-KR");
const fmtEok = (v: number) => `${(v / 100).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억원`; // 백만원 → 억원

/** 원본 지표 표. 모든 수치에 출처 배지 + 평균 관련 고정 주석. */
export function RawMetricsTable({ company }: { company: ScoredCompany }) {
  const m = company.metrics;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <Row label="1인 평균 급여액" m={m.avgSalaryManwon} fmt={formatManwon} />
            <Row label="평균 근속연수" m={m.avgTenureYears} fmt={(v) => `${v.toFixed(1)}년`} />
            <Row label="직원 수" m={m.employeeCount} fmt={(v) => `${fmtNum(v)}명`} />
            <Row label="직원 수 (전기)" m={m.employeeCountPrev} fmt={(v) => `${fmtNum(v)}명`} />
            <Row label="매출액" m={m.revenue} fmt={fmtEok} />
            <Row label="매출액 (전기)" m={m.revenuePrev} fmt={fmtEok} />
            <Row label="영업이익" m={m.operatingProfit} fmt={fmtEok} />
            <Row label="영업이익 (전기)" m={m.operatingProfitPrev} fmt={fmtEok} />
            <Row label="워라밸 지표" m={m.worklifeIndex} fmt={(v) => `${v} / 100`} />
          </tbody>
        </table>
      </div>
      {m.worklifeIndex?.note ? <p className="text-xs text-muted-foreground">워라밸 지표 근거: {m.worklifeIndex.note}</p> : null}
      <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER.averages}</p>
    </div>
  );
}
