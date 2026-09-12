import { AxisBar } from "@/components/common/AxisBar";
import { sortAxesByScore } from "@/lib/assessment";
import type { AssessmentResult } from "@/lib/types";

/** 4축 % 막대 (합 100). 폭 기준은 50 — 한 축이 가질 수 있는 최대값. */
export function AxisBreakdown({ result }: { result: AssessmentResult }) {
  const order = sortAxesByScore(result.raw);
  return (
    <div className="space-y-3">
      {order.map((axis, i) => (
        <AxisBar key={axis} axis={axis} value={result.percent[axis]} max={50} suffix="%" highlight={i === 0} />
      ))}
    </div>
  );
}
