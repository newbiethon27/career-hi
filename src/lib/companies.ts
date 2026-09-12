import manualJson from "../../data/companies.manual.json";
import rawJson from "../../data/companies.raw.json";
import demoJson from "../../data/companies.demo.json";
import { buildScoredCompanies } from "./companyScore";
import type { Company, CompanyRawMetrics, JobFamily, ScoredCompany, Sourced } from "./types";

type MetricKey = Exclude<keyof CompanyRawMetrics, "worklifeIndex">;
const METRIC_KEYS: MetricKey[] = [
  "avgSalaryManwon",
  "avgTenureYears",
  "employeeCount",
  "employeeCountPrev",
  "revenue",
  "revenuePrev",
  "operatingProfit",
  "operatingProfitPrev",
];

type RawEntry = Partial<Record<MetricKey, number | null>> & { asOf?: string | null; corpCode?: string | null };
type DemoEntry = Partial<Record<MetricKey, number | null>>;

const rawCompanies = (rawJson as { companies: Record<string, RawEntry> }).companies;
const demoCompanies = (demoJson as { companies: Record<string, DemoEntry> }).companies;

/**
 * 지표별 우선순위: DART 스냅샷(raw) → 데모 자리표시자(demo, source=manual) → null.
 * 파일이 곧 출처다 — 한 파일에 실데이터와 추정치를 섞지 않는다.
 */
function mergeMetrics(id: string, worklifeIndex: number | null, note: string): CompanyRawMetrics {
  const raw = rawCompanies[id] ?? {};
  const demo = demoCompanies[id] ?? {};
  const pick = (k: MetricKey): Sourced<number> | null => {
    const r = raw[k];
    if (typeof r === "number") return { value: r, source: "dart", asOf: raw.asOf ?? undefined };
    const d = demo[k];
    if (typeof d === "number") return { value: d, source: "manual", note: "데모 자리표시자 — fetch:dart 로 교체" };
    return null;
  };
  const m = {} as CompanyRawMetrics;
  for (const k of METRIC_KEYS) m[k] = pick(k);
  m.worklifeIndex = worklifeIndex === null ? null : { value: worklifeIndex, source: "manual", note };
  return m;
}

function buildCompanies(): Company[] {
  return manualJson.companies.map((c) => ({
    id: c.id,
    name: c.name,
    corpCode: rawCompanies[c.id]?.corpCode ?? c.corpCode ?? undefined,
    industry: c.industry,
    jobFamilies: c.jobFamilies as JobFamily[],
    metrics: mergeMetrics(c.id, c.worklifeIndex, c.note),
  }));
}

/**
 * 저장소 JSON 으로 만든 회사 목록.
 *
 * 런타임의 소스는 Supabase 이고(`lib/companies.server.ts`), 이 값은 두 군데서 쓰인다:
 *   1. Supabase 에 닿지 않을 때의 폴백 — 데모 중 화면이 비는 것을 막는다
 *   2. 테스트 픽스처 — 네트워크 없이 재현 가능한 점수 검증
 */
export const FALLBACK_COMPANIES: ScoredCompany[] = buildScoredCompanies(buildCompanies());

/** @deprecated 화면에서는 useCompanies() 를 쓰세요. 테스트 픽스처용 별칭입니다. */
export const COMPANIES = FALLBACK_COMPANIES;

export const FALLBACK_DART_GENERATED_AT: string | null = (rawJson as { generatedAt: string | null })
  .generatedAt;
