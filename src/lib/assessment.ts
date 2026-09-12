import {
  AXIS_TO_TYPE,
  MIXED_THRESHOLD,
  POINTS_PER_ANSWER,
  QUESTION_COUNT,
  SMOOTHING_ALPHA,
  TIE_ORDER,
  TOTAL_POINTS,
} from "./constants";
import { QUESTIONS } from "./questions";
import { AXES, type Answer, type AssessmentResult, type Axis } from "./types";
import { mapAxes } from "./utils";

/** raw 점수 동점 시 TIE_ORDER 고정 순서로 결정 — 랜덤을 쓰지 않는다 (재현성) */
export function sortAxesByScore(score: Record<Axis, number>): Axis[] {
  return [...AXES].sort(
    (x, y) => score[y] - score[x] || TIE_ORDER.indexOf(x) - TIE_ORDER.indexOf(y),
  );
}

export function scoreAssessment(answers: Answer[], now: Date = new Date()): AssessmentResult {
  if (answers.length !== QUESTION_COUNT) {
    throw new Error(`answers must have ${QUESTION_COUNT} entries, got ${answers.length}`);
  }

  // 1) 원점수 집계 — 합은 항상 TOTAL_POINTS(20)
  const raw = mapAxes(() => 0);
  answers.forEach((a, i) => {
    const q = QUESTIONS[i];
    const axis = a === "A" ? q.optionA.axis : q.optionB.axis;
    raw[axis] += POINTS_PER_ANSWER;
  });

  // 2) 표시용 퍼센트 — 합 100. 반올림 오차는 최대 축에 더한다.
  const percent = mapAxes((a) => Math.round((raw[a] / TOTAL_POINTS) * 100));
  const sorted = sortAxesByScore(raw);
  const diff = 100 - AXES.reduce((s, a) => s + percent[a], 0);
  percent[sorted[0]] += diff;

  // 3) Fit 계산용 가중치 — Laplace smoothing, 합 1.
  //    미선택 축도 α/(20+4α)의 영향력을 가진다 ("덜 중요"이지 "무관"이 아니다).
  const denom = TOTAL_POINTS + AXES.length * SMOOTHING_ALPHA;
  const weights = mapAxes((a) => (raw[a] + SMOOTHING_ALPHA) / denom);

  // 4) 유형 분류
  const primaryAxis = sorted[0];
  const secondaryAxis = sorted[1];

  return {
    answers: [...answers],
    raw,
    percent,
    weights,
    primaryAxis,
    secondaryAxis,
    primaryType: AXIS_TO_TYPE[primaryAxis],
    secondaryType: AXIS_TO_TYPE[secondaryAxis],
    isMixed: percent[primaryAxis] - percent[secondaryAxis] < MIXED_THRESHOLD,
    completedAt: now.toISOString(),
  };
}
