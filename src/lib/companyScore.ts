import { SCORE_OUT_MAX, SCORE_OUT_MIN } from "./constants";
import {
  AXES,
  type Axis,
  type Company,
  type CompanyRawMetrics,
  type DataSource,
  type ScoredCompany,
} from "./types";
import { clamp, median } from "./utils";

/** 클램프 구간을 명시한 min-max. 출력 하한 30 — 12개사뿐이라 최하위가 0점이 되는 오독을 막는다. */
export function normalize(
  x: number,
  lo: number,
  hi: number,
  outMin = SCORE_OUT_MIN,
  outMax = SCORE_OUT_MAX,
): number {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return Math.round(outMin + (outMax - outMin) * t);
}

/** 가용한 항목만으로 가중평균. 전부 결측이면 null. */
function weightedAvailable(parts: Array<{ score: number | null; weight: number }>): number | null {
  const avail = parts.filter((p): p is { score: number; weight: number } => p.score !== null);
  if (avail.length === 0) return null;
  const wsum = avail.reduce((s, p) => s + p.weight, 0);
  return Math.round(avail.reduce((s, p) => s + p.score * p.weight, 0) / wsum);
}

function growthRate(cur: number | null | undefined, prev: number | null | undefined): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return cur / prev - 1;
}

type AxisScore = { score: number | null; source: DataSource };

// ---------- 축별 산출 ----------

export function scoreCompensation(m: CompanyRawMetrics): AxisScore {
  if (!m.avgSalaryManwon) return { score: null, source: "derived" };
  // 급여 분포는 상위 꼬리가 길다 → 로그 변환. 구간은 유니버스(10개사, 2025 사업보고서) 실측 범위 9,000만 ~ 1억 9,000만원에 맞춰 잡았다.
  // 회사 수가 늘어 범위를 벗어나면 이 두 값을 갱신한다.
  const v = Math.log(m.avgSalaryManwon.value);
  return { score: normalize(v, Math.log(9000), Math.log(19000)), source: m.avgSalaryManwon.source };
}

export function scoreStability(m: CompanyRawMetrics): AxisScore {
  const tenureScore = m.avgTenureYears ? normalize(m.avgTenureYears.value, 3, 18) : null; // 실측 3.2 ~ 19.3년
  // 증가율이 아니라 "감소하지 않음"을 안정으로 본다. 상한 +5%로 낮게 잡아 급성장이 안정으로 둔갑하지 않게 한다.
  const trend = growthRate(m.employeeCount?.value, m.employeeCountPrev?.value);
  const trendScore = trend === null ? null : normalize(trend, -0.08, 0.05);
  const sizeScore = m.employeeCount
    ? normalize(Math.log(m.employeeCount.value), Math.log(500), Math.log(120000))
    : null;

  const score = weightedAvailable([
    { score: tenureScore, weight: 0.5 },
    { score: trendScore, weight: 0.25 },
    { score: sizeScore, weight: 0.25 },
  ]);
  const sources = [m.avgTenureYears, m.employeeCount].filter(Boolean).map((s) => s!.source);
  return { score, source: pickSource(sources) };
}

export function scoreGrowth(m: CompanyRawMetrics): AxisScore {
  const rev = growthRate(m.revenue?.value, m.revenuePrev?.value);
  const revScore = rev === null ? null : normalize(rev, -0.1, 0.35);

  // 영업이익: 전기가 0 이하이면 비율이 무의미 → 전환 여부로 판정
  let profScore: number | null = null;
  const op = m.operatingProfit?.value;
  const opPrev = m.operatingProfitPrev?.value;
  if (op != null && opPrev != null) {
    if (opPrev <= 0 && op > 0) profScore = 85; // 흑자전환
    else if (opPrev > 0 && op <= 0) profScore = 30; // 적자전환
    else if (opPrev <= 0 && op <= 0) profScore = 40; // 지속 적자
    else profScore = normalize(clamp(op / opPrev - 1, -0.5, 1.0), -0.3, 0.6);
  }

  const hc = growthRate(m.employeeCount?.value, m.employeeCountPrev?.value);
  const hcScore = hc === null ? null : normalize(hc, -0.05, 0.2);

  const score = weightedAvailable([
    { score: revScore, weight: 0.4 },
    { score: profScore, weight: 0.3 },
    { score: hcScore, weight: 0.3 },
  ]);
  const sources = [m.revenue, m.operatingProfit, m.employeeCount].filter(Boolean).map((s) => s!.source);
  return { score, source: pickSource(sources) };
}

/** Balance 는 공공데이터가 없다. 항상 manual 값을 그대로 쓰고 절대 'dart'로 표기하지 않는다. */
export function scoreBalance(m: CompanyRawMetrics): AxisScore {
  if (!m.worklifeIndex) return { score: null, source: "derived" };
  return { score: clamp(Math.round(m.worklifeIndex.value), 0, 100), source: "manual" };
}

/** 여러 지표가 섞였을 때: 하나라도 manual 이면 manual (실데이터로 과장 표기하지 않는다) */
function pickSource(sources: DataSource[]): DataSource {
  if (sources.length === 0) return "derived";
  if (sources.includes("manual")) return "manual";
  if (sources.every((s) => s === "dart")) return "dart";
  return "derived";
}

const SCORERS: Record<Axis, (m: CompanyRawMetrics) => AxisScore> = {
  compensation: scoreCompensation,
  balance: scoreBalance,
  stability: scoreStability,
  growth: scoreGrowth,
};

const FALLBACK_SCORE = 60; // 유니버스 전체가 결측일 때만 쓰는 중립값

/**
 * 원본 지표 → 4축 점수. 결측 축은 유니버스 중앙값으로 보간하고 source='derived', missingAxes 에 기록.
 */
export function buildScoredCompanies(companies: Company[]): ScoredCompany[] {
  const partial = companies.map((c) => {
    const axisScores = {} as Record<Axis, AxisScore>;
    for (const axis of AXES) axisScores[axis] = SCORERS[axis](c.metrics);
    return { company: c, axisScores };
  });

  const medians = {} as Record<Axis, number>;
  for (const axis of AXES) {
    const vals = partial.map((p) => p.axisScores[axis].score).filter((v): v is number => v !== null);
    medians[axis] = median(vals) ?? FALLBACK_SCORE;
  }

  return partial.map(({ company, axisScores }) => {
    const scores = {} as ScoredCompany["scores"];
    const scoreSources = {} as ScoredCompany["scoreSources"];
    const missingAxes: Axis[] = [];
    for (const axis of AXES) {
      const s = axisScores[axis];
      if (s.score === null) {
        scores[axis] = Math.round(medians[axis]);
        scoreSources[axis] = "derived";
        missingAxes.push(axis);
      } else {
        scores[axis] = s.score;
        scoreSources[axis] = s.source;
      }
    }
    return { ...company, scores, scoreSources, missingAxes };
  });
}
