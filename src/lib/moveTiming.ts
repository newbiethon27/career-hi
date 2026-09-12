import { FIT_GAP_SATURATION, MOVE_BANDS, MOVE_BAND_META, MOVE_TIMING_WEIGHTS as W } from "./constants";
import type { MoveBand, MoveTimingResult } from "./types";
import { clamp01, formatTenure, signed } from "./utils";

export interface MoveTimingInput {
  currentFit: number;
  bestFit: number | null; // 추천 1위 Fit. 추천 0건이면 null
  tenureMonths: number;
  currentSalary: number; // 만원
  companyAvgSalary: number | null; // 만원. 결측 가능
}

/** 근속 준비도 — 종 모양. 너무 짧아도 너무 길어도 낮다. */
export function tenureFactor(months: number): number {
  if (months < 12) return 0.15;
  if (months < 24) return 0.55;
  if (months < 60) return 1.0;
  if (months < 96) return 0.8;
  return 0.6;
}

export function bandOf(score: number): MoveBand {
  if (score <= MOVE_BANDS.stay) return "stay";
  if (score <= MOVE_BANDS.watch) return "watch";
  return "consider";
}

/**
 * 예측이 아니다. "지금 점검할 필요성"을 4개 관찰 가능한 신호로 합산한다.
 * ① 대안과의 적합도 격차 40 ② 현재 적합도 부족분 25 ③ 근속 준비도 20 ④ 보상 위치 15
 */
export function computeMoveTiming(input: MoveTimingInput): MoveTimingResult {
  const notes: string[] = [];

  const gap = input.bestFit === null ? 0 : input.bestFit - input.currentFit;
  const fitGap = W.fitGap * clamp01(gap / FIT_GAP_SATURATION);
  if (input.bestFit === null) notes.push("현재 회사보다 적합도가 높은 대안이 없어 격차 항목은 0점입니다.");

  const currentFitPenalty = W.currentFitPenalty * clamp01((70 - input.currentFit) / 30);

  const tenureReadiness = W.tenureReadiness * tenureFactor(input.tenureMonths);

  // ④ 회사 평균 급여는 전체 직원 평균 — 근속 1년 미만은 평균보다 낮은 게 정상이므로 제외
  let salaryGap = 0;
  let maxScore = 100;
  if (input.tenureMonths < 12) {
    notes.push("근속 1년 미만은 보상 위치 항목을 계산에서 제외합니다 (회사 평균 급여는 전체 직원 평균).");
  } else if (input.companyAvgSalary === null || input.companyAvgSalary <= 0) {
    maxScore = 100 - W.salaryGap;
    notes.push("회사 평균 급여 데이터가 없어 보상 위치 항목을 제외하고 85점 만점을 100점으로 환산했습니다.");
  } else {
    const ratio = input.currentSalary / input.companyAvgSalary;
    salaryGap = W.salaryGap * clamp01((1.0 - ratio) / 0.35);
  }

  const rawSum = fitGap + currentFitPenalty + tenureReadiness + salaryGap;
  const score = Math.round((rawSum / maxScore) * 100);
  const band = bandOf(score);

  const summary =
    `${MOVE_BAND_META[band].label} — 대안과의 적합도 격차 ${signed(Math.round(gap))}점, ` +
    `현재 적합도 ${input.currentFit}점, 근속 ${formatTenure(input.tenureMonths)}.`;

  return {
    score,
    band,
    components: {
      fitGap: Math.round(fitGap),
      currentFitPenalty: Math.round(currentFitPenalty),
      tenureReadiness: Math.round(tenureReadiness),
      salaryGap: Math.round(salaryGap),
    },
    maxScore,
    notes,
    summary,
  };
}
