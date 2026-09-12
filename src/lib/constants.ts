import type { Axis, CareerType, JobFamily, MoveBand } from "./types";

// ===== 튜닝 상수 — 데모 중 결과를 조정해야 할 때 이 블록만 만진다 =====
export const SMOOTHING_ALPHA = 1.0; // ↓낮추면 성향 대비 커짐 → Fit 분산 증가
export const MIN_FIT_MARGIN = 5; // 추천에 필요한 최소 Fit 개선폭 (Balance 가 수동 추정치라 ±5 는 오차 범위로 본다)
export const FIT_GAP_SATURATION = 20; // Move Timing: 대안과의 Fit 격차가 이 값이면 격차 항목 만점
export const SCORE_OUT_MIN = 30; // 회사 축 점수 하한
export const SCORE_OUT_MAX = 98; // 회사 축 점수 상한
export const TIE_ORDER: readonly Axis[] = ["compensation", "growth", "balance", "stability"];
export const MIXED_THRESHOLD = 5; // 1위-2위 격차(%p)가 이 미만이면 혼합형

export const MOVE_TIMING_WEIGHTS = {
  fitGap: 40,
  currentFitPenalty: 25,
  tenureReadiness: 20,
  salaryGap: 15,
} as const;
export const MOVE_BANDS = { stay: 39, watch: 64 } as const; // 이하 기준값

// ===== 검사 =====
export const POINTS_PER_ANSWER = 2;
export const QUESTION_COUNT = 10;
export const TOTAL_POINTS = POINTS_PER_ANSWER * QUESTION_COUNT; // 20

// ===== 라벨 =====
export const CAREER_TYPE_META: Record<
  CareerType,
  { axis: Axis; label: string; emoji: string; tagline: string; description: string }
> = {
  compensation_seeker: {
    axis: "compensation",
    label: "보상 추구형",
    emoji: "💰",
    tagline: "연봉과 보상 수준을 커리어 판단의 1순위로 두는 유형입니다.",
    description:
      "같은 일이라면 더 많이 받는 곳을 택하고, 성과가 보상으로 돌아오는 구조를 선호합니다. 회사의 평균 급여 수준과 업계 대비 보상 위치가 회사 선택의 핵심 기준이 됩니다. 반대로 보상이 정체된 환경에서는 동기가 빠르게 떨어질 수 있습니다.",
  },
  balance_seeker: {
    axis: "balance",
    label: "균형 추구형",
    emoji: "🌿",
    tagline: "일과 생활의 균형, 근무 환경을 가장 중요하게 보는 유형입니다.",
    description:
      "정시 퇴근, 유연근무, 짧은 통근처럼 하루의 리듬을 지킬 수 있는 조건을 우선합니다. 연봉이 조금 낮더라도 생활의 질이 유지되는 회사를 택하는 경향이 있습니다. 업무 강도가 높고 예측 불가능한 환경은 큰 비용으로 느껴집니다.",
  },
  stability_seeker: {
    axis: "stability",
    label: "안정 추구형",
    emoji: "🏛️",
    tagline: "고용 안정성과 조직의 지속성을 최우선으로 보는 유형입니다.",
    description:
      "평균 근속이 길고 구조조정 위험이 낮은, 오래 다닐 수 있는 회사를 선호합니다. 변동성이 큰 보상보다 예측 가능한 보상을, 급성장보다 꾸준함을 택합니다. 규모가 크고 사업이 안정된 조직에서 강점을 발휘합니다.",
  },
  growth_seeker: {
    axis: "growth",
    label: "성장 추구형",
    emoji: "🚀",
    tagline: "회사의 성장과 나의 커리어 가치 상승을 가장 중요하게 보는 유형입니다.",
    description:
      "빠르게 커가는 회사에서 새로운 기회를 잡고 역량을 키우는 것을 우선합니다. 지금의 안정보다 앞으로의 커리어 가치에 투자하며, 주식 보상 같은 장기 보상에도 열려 있습니다. 성장이 멈춘 조직에서는 답답함을 느끼기 쉽습니다.",
  },
};

export const AXIS_TO_TYPE: Record<Axis, CareerType> = {
  compensation: "compensation_seeker",
  balance: "balance_seeker",
  stability: "stability_seeker",
  growth: "growth_seeker",
};

export const JOB_FAMILY_LABEL: Record<JobFamily, string> = {
  dev: "소프트웨어 개발",
  data: "데이터·AI",
  pm: "기획·PM",
  design: "디자인",
  marketing: "마케팅·영업",
};

export const REGIONS = ["수도권", "충청", "영남", "호남", "기타"] as const;

export const MOVE_BAND_META: Record<MoveBand, { label: string; description: string }> = {
  stay: { label: "현재 회사 유지 권장", description: "지금 이직을 서두를 신호가 뚜렷하지 않습니다." },
  watch: { label: "관망 · 주기적 점검", description: "당장은 아니지만 시장을 살펴볼 만합니다." },
  consider: { label: "이직 검토 권장", description: "지금 대안을 진지하게 비교해볼 시점입니다." },
};

// ===== 고지 문구 (그대로 사용) =====
export const DISCLAIMER = {
  assessment:
    "이 진단은 심리학적으로 검증된 검사가 아니라, 회사 선택 시 무엇을 우선하는지 파악하기 위한 서비스용 커리어 선호도 진단입니다.",
  averages:
    "1인 평균 급여액은 회사 전체 직원의 평균이며 개인의 예상 연봉이 아닙니다. 평균 근속연수는 해당 기간의 근무를 보장하지 않습니다.",
  moveTiming:
    "이 지수는 이직 시점이나 퇴사 확률을 예측하지 않습니다. 적합도·근속·보상 위치를 정해진 규칙으로 합산한 참고 지표이며, 최종 판단은 본인의 상황에 따라 달라집니다.",
  footer:
    "회사 지표는 금융감독원 전자공시시스템(DART) 사업보고서 기준이며, 워라밸 지표는 공개 정보를 바탕으로 한 서비스 자체 추정치입니다. 본 서비스의 결과는 커리어 의사결정을 돕기 위한 참고 정보입니다.",
} as const;

export const STORAGE_KEYS = {
  assessment: "chi:assessment",
  profile: "chi:profile",
  progress: "chi:answers-progress",
} as const;

export const OTHER_COMPANY_ID = "other";
