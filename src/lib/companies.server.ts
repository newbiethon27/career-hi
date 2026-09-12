import "server-only";

import { buildScoredCompanies } from "./companyScore";
import { FALLBACK_COMPANIES, FALLBACK_DART_GENERATED_AT } from "./companies";
import { supabase, type CompanyRow } from "./supabase";
import type { Company, CompanyRawMetrics, JobFamily, ScoredCompany, Sourced } from "./types";

export type CompaniesOrigin = "supabase" | "fallback";

export interface CompaniesPayload {
  companies: ScoredCompany[];
  origin: CompaniesOrigin;
  /** origin === "fallback" 일 때 왜 폴백했는지 — UI 배너와 서버 로그에 쓴다 */
  fallbackReason: string | null;
}

/** numeric/bigint 가 문자열로 오는 경우를 흡수한다 */
function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function dart(v: number | null, asOf: string | null): Sourced<number> | null {
  return v === null ? null : { value: v, source: "dart", asOf: asOf ?? undefined };
}

function rowToCompany(r: CompanyRow): Company {
  const asOf = r.dart_as_of;
  const metrics: CompanyRawMetrics = {
    avgSalaryManwon: dart(num(r.avg_salary_manwon), asOf),
    avgTenureYears: dart(num(r.avg_tenure_years), asOf),
    employeeCount: dart(num(r.employee_count), asOf),
    employeeCountPrev: dart(num(r.employee_count_prev), asOf),
    revenue: dart(num(r.revenue), asOf),
    revenuePrev: dart(num(r.revenue_prev), asOf),
    operatingProfit: dart(num(r.operating_profit), asOf),
    operatingProfitPrev: dart(num(r.operating_profit_prev), asOf),
    // 워라밸은 공공데이터가 없다 — 항상 manual 로 표기한다 (절대 dart 로 올리지 않는다)
    worklifeIndex:
      r.worklife_index === null
        ? null
        : { value: r.worklife_index, source: "manual", note: r.worklife_note ?? undefined },
  };
  return {
    id: r.id,
    name: r.name,
    corpCode: r.corp_code ?? undefined,
    industry: r.industry,
    jobFamilies: r.job_families as JobFamily[],
    metrics,
  };
}

/**
 * 회사 데이터 단일 진입점 (서버 전용).
 *
 * Supabase 가 소스이고, 닿지 않거나 비어 있으면 저장소의 JSON 으로 폴백한다.
 * 폴백이 있어야 데모 중 네트워크·DB 장애로 화면이 비는 일이 없다 — 대신 어떤 소스를
 * 썼는지 origin 으로 돌려주고 UI 가 이를 그대로 표시한다 (조용히 속이지 않는다).
 */
export async function loadCompanies(): Promise<CompaniesPayload> {
  if (!supabase) {
    return {
      companies: FALLBACK_COMPANIES,
      origin: "fallback",
      fallbackReason: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 가 설정되지 않았습니다.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<CompanyRow[]>();

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("companies 테이블이 비어 있습니다. 시드 SQL을 실행했나요?");

    return { companies: buildScoredCompanies(data.map(rowToCompany)), origin: "supabase", fallbackReason: null };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error("[companies] Supabase 조회 실패 → JSON 폴백:", reason);
    return { companies: FALLBACK_COMPANIES, origin: "fallback", fallbackReason: reason };
  }
}

export { FALLBACK_DART_GENERATED_AT };
