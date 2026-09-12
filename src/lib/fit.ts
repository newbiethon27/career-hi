import { AXES, type AxisVector, type FitResult } from "./types";
import { mapAxes } from "./utils";

/**
 * Fit = Σ weights[axis] × scores[axis]
 * weights 합 = 1, scores ∈ [30, 98] 이므로 Fit 도 자연히 같은 범위에 들어온다. 재정규화하지 않는다.
 */
export function computeFit(weights: AxisVector, scores: AxisVector, companyId = ""): FitResult {
  const contributions = mapAxes((a) => weights[a] * scores[a]);
  const fit = Math.round(AXES.reduce((s, a) => s + contributions[a], 0));
  return { companyId, fit, contributions };
}
