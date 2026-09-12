import { AXES, AXIS_LABEL, type AssessmentResult, type Axis, type ScoredCompany } from "./types";
import { signed } from "./utils";

const L = AXIS_LABEL;

/**
 * 추천 문장의 비교 기준. 재직자는 현재 회사, 구직자는 업계 평균이다.
 * label 은 문장에 그대로 들어가므로 "현재 회사" / "업계 평균" 처럼 명사로 넘긴다.
 */
export interface Baseline {
  company: ScoredCompany;
  label: string;
}

/** Fit 에 가장 크게 기여한 2개 축 (weights × score) 을 기준 회사 대비 diff 와 함께 문장화 */
export function buildReasons(
  a: AssessmentResult,
  base: Baseline,
  target: ScoredCompany,
): string[] {
  const top2 = [...AXES]
    .map((ax) => ({ ax, contrib: a.weights[ax] * target.scores[ax] }))
    .sort((x, y) => y.contrib - x.contrib)
    .slice(0, 2);
  const [t1, t2] = top2;
  const d1 = target.scores[t1.ax] - base.company.scores[t1.ax];
  const d2 = target.scores[t2.ax] - base.company.scores[t2.ax];
  const rank1 = a.primaryAxis === t1.ax ? "가장 중시하는" : "중시하는";
  return [
    `당신이 ${rank1} ${L[t1.ax]}에서 ${target.scores[t1.ax]}점(${base.label} ${base.company.scores[t1.ax]}점, ${signed(d1)}), ` +
      `${L[t2.ax]}에서 ${target.scores[t2.ax]}점(${base.label} ${base.company.scores[t2.ax]}점, ${signed(d2)})입니다.`,
  ];
}

/** 기준 회사 대비 가장 크게 떨어지는 축 — 10점 이상 하락할 때만 */
export function buildCautions(
  _a: AssessmentResult,
  base: Baseline,
  target: ScoredCompany,
): string[] {
  const cur = base.company.scores;
  let worst: Axis = AXES[0];
  for (const ax of AXES) {
    if (target.scores[ax] - cur[ax] < target.scores[worst] - cur[worst]) worst = ax;
  }
  const d = target.scores[worst] - cur[worst];
  return d <= -10 ? [`${L[worst]} 축은 ${base.label}보다 ${Math.abs(d)}점 낮습니다.`] : [];
}

/** 현재 회사 진단 문장 (재직자 부가 기능 전용). 분기는 2개뿐 — 늘리지 않는다. */
export function buildDiagnosis(
  a: AssessmentResult,
  current: ScoredCompany,
  rankOfPrimaryAxis: number,
  poolSize: number,
): string {
  let strongest: Axis = AXES[0];
  for (const ax of AXES) if (current.scores[ax] > current.scores[strongest]) strongest = ax;

  if (strongest === a.primaryAxis) {
    return (
      `당신이 가장 중시하는 ${L[a.primaryAxis]}에서 ${current.name}은(는) ${current.scores[a.primaryAxis]}점으로, ` +
      `비교 대상 ${poolSize}개사 중 ${rankOfPrimaryAxis}위입니다. 성향과 잘 맞는 편입니다.`
    );
  }
  return (
    `당신은 ${L[a.primaryAxis]}과(와) ${L[a.secondaryAxis]}을(를) 중요하게 생각하지만, ` +
    `${current.name}은(는) ${L[strongest]}(${current.scores[strongest]}점)에 강점이 있습니다. ` +
    `가장 중시하는 ${L[a.primaryAxis]} 축은 ${current.scores[a.primaryAxis]}점으로 ${poolSize}개사 중 ${rankOfPrimaryAxis}위입니다.`
  );
}

/** /compare 하단 요약 — 문장이 아니라 키워드로 정리한다 (조사 처리 불필요, 한눈에 읽힌다) */
export interface CompareDigest {
  verdict: "better" | "similar" | "worse";
  fitDelta: number;
  /** 내가 우선하는 기준 (1·2순위) */
  priorities: Axis[];
  /** 비교 회사가 앞서는 축, 격차 큰 순 */
  up: Array<{ axis: Axis; delta: number }>;
  /** 기준 회사가 앞서는 축, 격차 큰 순 */
  down: Array<{ axis: Axis; delta: number }>;
}

export function buildCompareDigest(a: AssessmentResult, base: Baseline, target: ScoredCompany, fitDelta: number): CompareDigest {
  const cur = base.company.scores;
  const deltas = AXES.map((axis) => ({ axis, delta: target.scores[axis] - cur[axis] }));
  return {
    verdict: fitDelta >= 5 ? "better" : fitDelta <= -5 ? "worse" : "similar",
    fitDelta,
    priorities: [a.primaryAxis, a.secondaryAxis],
    up: deltas.filter((d) => d.delta >= 5).sort((x, y) => y.delta - x.delta),
    down: deltas.filter((d) => d.delta <= -5).sort((x, y) => x.delta - y.delta),
  };
}
