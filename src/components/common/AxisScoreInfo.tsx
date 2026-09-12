import { InfoPopover } from "@/components/common/InfoPopover";
import { SourceBadge } from "@/components/common/SourceBadge";
import { AXIS_METHOD, SOURCE_NOTE } from "@/lib/method";
import { AXIS_LABEL, type Axis, type DataSource } from "@/lib/types";
import { josa } from "@/lib/utils";

interface Props {
  axis: Axis;
  source: DataSource;
  score?: number;
  className?: string;
  align?: "left" | "right";
}

/**
 * 축 점수 옆의 "?" 하나. 출처 배지는 상시 노출하지 않고 눌렀을 때 설명 안에서 보여준다
 * — 숫자 옆이 배지로 덮이지 않게 하면서 근거는 한 번의 클릭 거리에 둔다.
 */
export function AxisScoreInfo({ axis, source, score, className, align = "right" }: Props) {
  return (
    <InfoPopover
      className={className}
      align={align}
      label={`${AXIS_LABEL[axis]} 점수 산출 방식 설명`}
      title={`${AXIS_LABEL[axis]} ${josa(score != null ? `${score}점` : "점수", "은", "는")} 이렇게 나왔습니다`}
    >
      <span className="mb-2 block">
        <SourceBadge source={source} />
      </span>
      {AXIS_METHOD[axis].how}
      <span className="mt-2 block">{SOURCE_NOTE[source].note}</span>
    </InfoPopover>
  );
}
