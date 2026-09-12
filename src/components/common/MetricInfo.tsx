import { InfoPopover } from "@/components/common/InfoPopover";
import { SourceBadge } from "@/components/common/SourceBadge";
import { METRIC_NOTE, SOURCE_NOTE } from "@/lib/method";
import { josa } from "@/lib/utils";
import type { CompanyRawMetrics, Sourced } from "@/lib/types";

export type MetricKey = keyof CompanyRawMetrics;

interface Props {
  label: string;
  metric: MetricKey;
  m: Sourced<number>;
  className?: string;
  align?: "left" | "right";
}

/** 원본 지표 옆의 "?" 하나. 출처 배지·기준시점·근거는 눌렀을 때 안에서 보여준다. */
export function MetricInfo({ label, metric, m, className, align = "right" }: Props) {
  return (
    <InfoPopover className={className} align={align} label={`${label} 출처 설명`} title={`${josa(label, "은", "는")} 이렇게 집계했습니다`}>
      <span className="mb-2 block">
        <SourceBadge source={m.source} asOf={m.asOf} />
      </span>
      {METRIC_NOTE[metric]}
      <span className="mt-2 block">{SOURCE_NOTE[m.source].note}</span>
      {m.note ? <span className="mt-2 block">근거: {m.note}</span> : null}
    </InfoPopover>
  );
}
