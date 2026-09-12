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

/** 단일 진입점. 모듈 로드 시 1회 계산해 캐싱한다 (12개사 × 4축 < 1ms). */
export const COMPANIES: ScoredCompany[] = buildScoredCompanies(buildCompanies());

export function getCompany(id: string): ScoredCompany | undefined {
  return COMPANIES.find((c) => c.id === id);
}

export const DART_GENERATED_AT: string | null = (rawJson as { generatedAt: string | null }).generatedAt;
