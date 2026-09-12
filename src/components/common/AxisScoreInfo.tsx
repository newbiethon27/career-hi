import { InfoPopover } from "@/components/common/InfoPopover";
import { SourceBadge } from "@/components/common/SourceBadge";
import { AXIS_METHOD, SOURCE_NOTE } from "@/lib/method";
import { AXIS_LABEL, type Axis, type ScoredCompany } from "@/lib/types";
import { josa } from "@/lib/utils";

interface Props {
  axis: Axis;
  company: ScoredCompany;
  className?: string;
  align?: "left" | "right";
}

/**
 * 축 점수 옆의 "?" 하나. 출처 배지는 상시 노출하지 않고 눌렀을 때 설명 안에서 보여준다
 * — 숫자 옆이 배지로 덮이지 않게 하면서 근거는 한 번의 클릭 거리에 둔다.
 */
export function AxisScoreInfo({ axis, company, className, align = "right" }: Props) {
  const score = company.scores[axis];
  const source = company.scoreSources[axis];
  // 균형 축은 워라밸 지표를 그대로 쓰므로 그 회사의 추정 근거를 함께 보여준다
  const note = axis === "balance" ? company.metrics.worklifeIndex?.note : undefined;

  return (
    <InfoPopover
      className={className}
      align={align}
      label={`${AXIS_LABEL[axis]} 점수 산출 방식 설명`}
      title={`${AXIS_LABEL[axis]} ${josa(`${score}점`, "은", "는")} 이렇게 나왔습니다`}
    >
      <span className="mb-2 block">
        <SourceBadge source={source} />
      </span>
      {AXIS_METHOD[axis].how}
      <span className="mt-2 block">{SOURCE_NOTE[source].note}</span>
      {note ? <span className="mt-2 block">근거: {note}</span> : null}
    </InfoPopover>
  );
}
