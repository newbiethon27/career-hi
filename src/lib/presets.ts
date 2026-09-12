import { scoreAssessment } from "./assessment";
import type { Answer, AssessmentResult, EmployedProfile } from "./types";

/**
 * 데모 페르소나. 같은 회사·직군·연봉·근속이지만 성향이 달라 추천이 달라지는 대비를 만든다.
 * 답변 벡터는 §6.2 문항 축 배치를 기준으로 손으로 설계했다 (tests/persona.test.ts 에서 검증).
 */
export type PresetId = "devA" | "devB";

export interface Preset {
  id: PresetId;
  title: string;
  subtitle: string;
  answers: Answer[];
  profile: EmployedProfile;
}

/** 공통 프로필 — 두 페르소나의 유일한 차이는 성향이다. 데모는 재직자(부가 기능 포함) 시나리오다. */
export const SHARED_PROFILE: EmployedProfile = {
  jobFamily: "dev",
  currentCompanyId: "samsung-sds",
  currentSalary: 7000,
  tenureMonths: 38,
  region: "수도권",
  commuteMinutes: 45,
};

export const PRESETS: Record<PresetId, Preset> = {
  devA: {
    id: "devA",
    title: "개발자 A",
    subtitle: "더 벌고, 더 성장하고 싶다 (보상·성장)",
    // 보상 4회 / 성장 3회 / 균형 2회 / 안정 1회 → 40 / 30 / 20 / 10
    answers: ["A", "A", "A", "A", "B", "B", "A", "B", "B", "A"],
    profile: SHARED_PROFILE,
  },
  devB: {
    id: "devB",
    title: "개발자 B",
    subtitle: "오래, 안정적으로 다니고 싶다 (안정·균형)",
    // 안정 4회 / 균형 3회 / 보상 2회 / 성장 1회 → 40 / 30 / 20 / 10
    answers: ["B", "B", "A", "B", "A", "A", "A", "B", "B", "A"],
    profile: SHARED_PROFILE,
  },
};

export function buildPresetAssessment(id: PresetId): AssessmentResult {
  return scoreAssessment(PRESETS[id].answers);
}
