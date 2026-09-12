/**
 * OpenDART 응답 문자열 파서. 앱 런타임에서는 쓰지 않고 scripts/fetch-dart.ts 와 tests 에서만 쓴다.
 * 실제 응답은 "112,000,000" / "-" / "12년 4개월" / "12.4" 처럼 표기가 혼재한다.
 */

/** "112,000,000" / "-" / "1,234" → number | null */
export function parseAmount(s: unknown): number | null {
  if (s == null) return null;
  const t = String(s).replace(/,/g, "").trim();
  if (t === "" || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** "12.4" / "12년 4개월" / "12.4년" / "12년" / "3년 11월" → 연 단위 소수 (소수점 1자리) */
export function parseTenureYears(s: unknown): number | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (t === "" || t === "-") return null;
  const ym = t.match(/(\d+(?:\.\d+)?)\s*년(?:\s*(\d+)\s*개?월)?/);
  if (ym) {
    const y = Number(ym[1]);
    const m = ym[2] ? Number(ym[2]) : 0;
    return Math.round((y + m / 12) * 10) / 10;
  }
  const n = Number(t.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
}

export interface EmpRow {
  sm?: string; // 합계(직원 수)
  jan_salary_am?: string; // 1인 평균 급여액 (원)
  avrg_cnwk_sdytrn?: string; // 평균 근속연수
  fo_bbm?: string; // 사업부문
  sexdstn?: string; // 성별
}

/** 사업부문별 행과 "성별합계" 행이 함께 오면 합계 행만 쓴다 (안 그러면 2배로 합산된다). */
export function selectRows(rows: EmpRow[]): EmpRow[] {
  const totals = rows.filter((r) => (r.fo_bbm ?? "").includes("합계"));
  return totals.length > 0 ? totals : rows;
}

/** 여러 행(성별 등)을 합산. 급여·근속은 직원 수 가중평균. 원 → 만원 변환. */
export function aggregateEmployees(allRows: EmpRow[]): {
  employeeCount: number | null;
  avgSalaryManwon: number | null;
  avgTenureYears: number | null;
} {
  const rows = selectRows(allRows);
  let count = 0;
  let salaryWeighted = 0;
  let salaryWeight = 0;
  let tenureWeighted = 0;
  let tenureWeight = 0;
  for (const row of rows) {
    const n = parseAmount(row.sm) ?? 0;
    if (n <= 0) continue;
    count += n;
    const sal = parseAmount(row.jan_salary_am);
    if (sal != null && sal > 0) {
      salaryWeighted += sal * n;
      salaryWeight += n;
    }
    const ten = parseTenureYears(row.avrg_cnwk_sdytrn);
    if (ten != null) {
      tenureWeighted += ten * n;
      tenureWeight += n;
    }
  }
  return {
    employeeCount: count > 0 ? count : null,
    avgSalaryManwon: salaryWeight > 0 ? Math.round(salaryWeighted / salaryWeight / 10000) : null,
    avgTenureYears: tenureWeight > 0 ? Math.round((tenureWeighted / tenureWeight) * 10) / 10 : null,
  };
}
