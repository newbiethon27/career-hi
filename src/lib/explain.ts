import { AXES, AXIS_LABEL, type AssessmentResult, type Axis, type ScoredCompany } from "./types";
import { signed } from "./utils";

const L = AXIS_LABEL;

/** Fit 에 가장 크게 기여한 2개 축 (weights × score) 을 현재 회사 대비 diff 와 함께 문장화 */
export function buildReasons(
  a: AssessmentResult,
  current: ScoredCompany,
  target: ScoredCompany,
): string[] {
  const top2 = [...AXES]
    .map((ax) => ({ ax, contrib: a.weights[ax] * target.scores[ax] }))
    .sort((x, y) => y.contrib - x.contrib)
    .slice(0, 2);
  const [t1, t2] = top2;
  const d1 = target.scores[t1.ax] - current.scores[t1.ax];
  const d2 = target.scores[t2.ax] - current.scores[t2.ax];
  const rank1 = a.primaryAxis === t1.ax ? "가장 중시하는" : "중시하는";
  return [
    `당신이 ${rank1} ${L[t1.ax]}에서 ${target.scores[t1.ax]}점(현재 ${current.scores[t1.ax]}점, ${signed(d1)}), ` +
      `${L[t2.ax]}에서 ${target.scores[t2.ax]}점(현재 ${current.scores[t2.ax]}점, ${signed(d2)})입니다.`,
  ];
}

/** 현재 회사 대비 가장 크게 떨어지는 축 — 10점 이상 하락할 때만 */
export function buildCautions(
  _a: AssessmentResult,
  current: ScoredCompany,
  target: ScoredCompany,
): string[] {
  let worst: Axis = AXES[0];
  for (const ax of AXES) {
    if (target.scores[ax] - current.scores[ax] < target.scores[worst] - current.scores[worst]) worst = ax;
  }
  const d = target.scores[worst] - current.scores[worst];
  return d <= -10 ? [`${L[worst]} 축은 현재 회사보다 ${Math.abs(d)}점 낮습니다.`] : [];
}

/** 현재 회사 진단 문장. 분기는 2개뿐 — 늘리지 않는다. */
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

/** /compare 하단 요약 */
export function buildCompareSummary(
  a: AssessmentResult,
  current: ScoredCompany,
  target: ScoredCompany,
  fitDelta: number,
): string {
  const up = AXES.filter((ax) => target.scores[ax] - current.scores[ax] >= 5);
  const down = AXES.filter((ax) => target.scores[ax] - current.scores[ax] <= -5);
  const head =
    fitDelta > 0
      ? `${L[a.primaryAxis]}과(와) ${L[a.secondaryAxis]}을(를) 우선한다면 ${target.name}이(가) 더 적합합니다(적합도 ${signed(fitDelta)}).`
      : `${target.name}은(는) 현재 회사보다 적합도가 높지 않습니다(적합도 ${signed(fitDelta)}).`;
  const upText = up.length ? ` ${up.map((ax) => L[ax]).join("·")} 축이 높아집니다.` : "";
  const downText = down.length
    ? ` 대신 ${down.map((ax) => `${L[ax]}(${signed(target.scores[ax] - current.scores[ax])})`).join(", ")} 축에서는 현재 회사가 앞섭니다.`
    : "";
  return head + upText + downText;
}
