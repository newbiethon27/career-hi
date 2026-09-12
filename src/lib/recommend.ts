import { MIN_FIT_MARGIN, OTHER_COMPANY_ID } from "./constants";
import { buildCautions, buildReasons, type Baseline } from "./explain";
import { computeFit } from "./fit";
import {
  AXES,
  isEmployed,
  type AssessmentResult,
  type FitResult,
  type Recommendation,
  type ScoredCompany,
  type UserProfile,
} from "./types";
import { mapAxes, median } from "./utils";

export interface CurrentFit {
  company: ScoredCompany;
  fit: FitResult;
  isSynthetic: boolean;
}

export interface RecommendResult {
  /** 재직자 부가 기능에서만 존재한다. 구직자(기본 플로우)는 null. */
  current: CurrentFit | null;
  /** 추천 카드가 비교하는 기준 — 재직자는 현재 회사, 구직자는 업계 평균 */
  baseline: { company: ScoredCompany; fit: FitResult; label: string };
  top: Recommendation[];
  ranked: Array<{ company: ScoredCompany; fit: FitResult }>; // 풀 전체, 정렬됨
  poolSize: number;
  /** 사용자 primary 축 기준 현재 회사 순위 (풀 + 현재 회사). 구직자는 null. */
  primaryAxisRank: number | null;
}

/** 유니버스 중앙값으로 만든 합성 회사. UI 는 실제 회사와 반드시 구분해서 표시한다. */
export function buildSyntheticCompany(
  companies: ScoredCompany[],
  name = "업계 평균 (목록 외 회사)",
): ScoredCompany {
  const scores = mapAxes((a) => Math.round(median(companies.map((c) => c.scores[a])) ?? 60));
  return {
    id: OTHER_COMPANY_ID,
    name,
    industry: "-",
    jobFamilies: ["dev", "data", "pm", "design", "marketing"],
    metrics: {
      avgSalaryManwon: null,
      avgTenureYears: null,
      employeeCount: null,
      employeeCountPrev: null,
      revenue: null,
      revenuePrev: null,
      operatingProfit: null,
      operatingProfitPrev: null,
      worklifeIndex: null,
    },
    scores,
    scoreSources: mapAxesSource("derived"),
    missingAxes: [...AXES],
  };
}

function mapAxesSource(src: ScoredCompany["scoreSources"]["compensation"]) {
  return { compensation: src, balance: src, stability: src, growth: src };
}

export function resolveCurrentCompany(
  currentCompanyId: string,
  companies: ScoredCompany[],
): { company: ScoredCompany; isSynthetic: boolean } {
  const found = companies.find((c) => c.id === currentCompanyId);
  if (found) return { company: found, isSynthetic: false };
  return { company: buildSyntheticCompany(companies), isSynthetic: true };
}

/** 동점 처리: primary 축 → secondary 축 → id 사전순. 항상 재현 가능. */
export function compareByFitThenTiebreak(a: AssessmentResult) {
  return (
    x: { company: ScoredCompany; fit: FitResult },
    y: { company: ScoredCompany; fit: FitResult },
  ): number =>
    y.fit.fit - x.fit.fit ||
    y.company.scores[a.primaryAxis] - x.company.scores[a.primaryAxis] ||
    y.company.scores[a.secondaryAxis] - x.company.scores[a.secondaryAxis] ||
    (x.company.id < y.company.id ? -1 : x.company.id > y.company.id ? 1 : 0);
}

/**
 * 두 가지 모드로 동작한다.
 * - 구직자(기본): 현재 회사가 없다. 직군이 맞는 회사를 Fit 순으로 줄 세우고 상위 3곳을 추천한다.
 *   비교 기준은 풀의 업계 평균이며, 개선폭 필터를 걸지 않는다 (비교할 현재 회사가 없으므로).
 * - 재직자(부가): 현재 회사를 풀에서 빼고, 현재 Fit 보다 MIN_FIT_MARGIN 넘게 높은 곳만 추천한다.
 */
export function recommend(
  assessment: AssessmentResult,
  profile: UserProfile,
  companies: ScoredCompany[],
): RecommendResult {
  const employed = isEmployed(profile);

  // 1. 현재 회사 Fit — 재직자만
  const current: CurrentFit | null = employed
    ? (() => {
        const { company, isSynthetic } = resolveCurrentCompany(profile.currentCompanyId!, companies);
        return { company, fit: computeFit(assessment.weights, company.scores, company.id), isSynthetic };
      })()
    : null;

  // 2. 후보 풀 — 현재 회사 제외 / 직군 불일치 제외 / 2축 이상 결측 제외
  const pool = companies
    .filter((c) => c.id !== profile.currentCompanyId)
    .filter((c) => c.jobFamilies.includes(profile.jobFamily))
    .filter((c) => c.missingAxes.length < 2);

  // 3. Fit 계산 + 정렬
  const ranked = pool
    .map((c) => ({ company: c, fit: computeFit(assessment.weights, c.scores, c.id) }))
    .sort(compareByFitThenTiebreak(assessment));
  ranked.forEach((r, i) => (r.fit.rankInPool = i + 1));

  // 4. 비교 기준 — 재직자는 현재 회사, 구직자는 풀의 업계 평균(합성)
  const baseline: RecommendResult["baseline"] = current
    ? { company: current.company, fit: current.fit, label: "현재 회사" }
    : (() => {
        const company = buildSyntheticCompany(pool, `업계 평균 (비교 대상 ${pool.length}개사 중앙값)`);
        return { company, fit: computeFit(assessment.weights, company.scores, company.id), label: "업계 평균" };
      })();
  const base: Baseline = { company: baseline.company, label: baseline.label };

  // 5. 상위 3개. 재직자는 유의미한 개선만 — 0건일 수 있다 (의도된 동작)
  const candidates = current
    ? ranked.filter((r) => r.fit.fit > current.fit.fit + MIN_FIT_MARGIN)
    : ranked;
  const top: Recommendation[] = candidates.slice(0, 3).map((r) => ({
    company: r.company,
    fit: r.fit,
    fitDelta: r.fit.fit - baseline.fit.fit,
    reasons: buildReasons(assessment, base, r.company),
    cautions: buildCautions(assessment, base, r.company),
  }));

  // 6. primary 축 기준 현재 회사 순위 (풀 + 현재 회사)
  const ax = assessment.primaryAxis;
  const primaryAxisRank = current
    ? 1 + pool.filter((c) => c.scores[ax] > current.company.scores[ax]).length
    : null;

  return { current, baseline, top, ranked, poolSize: pool.length, primaryAxisRank };
}
