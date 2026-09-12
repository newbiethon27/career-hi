import { MIN_FIT_MARGIN, OTHER_COMPANY_ID } from "./constants";
import { buildCautions, buildReasons } from "./explain";
import { computeFit } from "./fit";
import {
  AXES,
  type AssessmentResult,
  type FitResult,
  type Recommendation,
  type ScoredCompany,
  type UserProfile,
} from "./types";
import { mapAxes, median } from "./utils";

export interface RecommendResult {
  current: { company: ScoredCompany; fit: FitResult; isSynthetic: boolean };
  top: Recommendation[];
  ranked: Array<{ company: ScoredCompany; fit: FitResult }>; // 풀 전체, 정렬됨
  poolSize: number;
  /** 사용자 primary 축 기준 현재 회사 순위 (풀 + 현재 회사 중) */
  primaryAxisRank: number;
}

/** 'other' 선택 시: 유니버스 중앙값으로 만든 합성 회사. UI 는 isSynthetic 으로 구분한다. */
export function buildSyntheticCompany(companies: ScoredCompany[]): ScoredCompany {
  const scores = mapAxes((a) => Math.round(median(companies.map((c) => c.scores[a])) ?? 60));
  return {
    id: OTHER_COMPANY_ID,
    name: "업계 평균 (목록 외 회사)",
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
  profile: UserProfile,
  companies: ScoredCompany[],
): { company: ScoredCompany; isSynthetic: boolean } {
  const found = companies.find((c) => c.id === profile.currentCompanyId);
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

export function recommend(
  assessment: AssessmentResult,
  profile: UserProfile,
  companies: ScoredCompany[],
): RecommendResult {
  // 1. 현재 회사 Fit
  const { company: currentCompany, isSynthetic } = resolveCurrentCompany(profile, companies);
  const currentFit = computeFit(assessment.weights, currentCompany.scores, currentCompany.id);

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

  // 4. 유의미한 개선만 남기고 상위 3개 — 0건일 수 있다 (의도된 동작)
  const top: Recommendation[] = ranked
    .filter((r) => r.fit.fit > currentFit.fit + MIN_FIT_MARGIN)
    .slice(0, 3)
    .map((r) => ({
      company: r.company,
      fit: r.fit,
      fitDelta: r.fit.fit - currentFit.fit,
      reasons: buildReasons(assessment, currentCompany, r.company),
      cautions: buildCautions(assessment, currentCompany, r.company),
    }));

  // 5. primary 축 기준 현재 회사 순위 (풀 + 현재 회사)
  const ax = assessment.primaryAxis;
  const primaryAxisRank =
    1 + pool.filter((c) => c.scores[ax] > currentCompany.scores[ax]).length;

  return {
    current: { company: currentCompany, fit: currentFit, isSynthetic },
    top,
    ranked,
    poolSize: pool.length,
    primaryAxisRank,
  };
}
