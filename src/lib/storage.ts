import { z } from "zod";
import { QUESTION_COUNT, STORAGE_KEYS } from "./constants";
import type { AssessmentResult, UserProfile } from "./types";

const axisVector = z.object({
  compensation: z.number(),
  balance: z.number(),
  stability: z.number(),
  growth: z.number(),
});
const axis = z.enum(["compensation", "balance", "stability", "growth"]);
const careerType = z.enum(["compensation_seeker", "balance_seeker", "stability_seeker", "growth_seeker"]);

export const assessmentSchema = z.object({
  answers: z.array(z.enum(["A", "B"])).length(QUESTION_COUNT),
  raw: axisVector,
  percent: axisVector,
  weights: axisVector,
  primaryAxis: axis,
  secondaryAxis: axis,
  primaryType: careerType,
  secondaryType: careerType,
  isMixed: z.boolean(),
  completedAt: z.string(),
});

/**
 * 직군만 있으면 유효하다 (구직자 기본 플로우).
 * 현재 회사 3개 값은 부가 기능 전용이며 "전부 있거나 전부 없거나" 둘 중 하나여야 한다
 * — 일부만 남으면 Fit·Move Timing 이 조용히 틀린 값을 내기 때문이다.
 */
export const profileSchema = z
  .object({
    jobFamily: z.enum(["dev", "data", "pm", "design", "marketing"]),
    currentCompanyId: z.string().min(1).optional(),
    currentSalary: z.number().min(1000).max(50000).optional(),
    tenureMonths: z.number().int().min(0).max(480).optional(),
    region: z.string().optional(),
    commuteMinutes: z.number().int().min(0).max(180).optional(),
  })
  .refine(
    (p) => {
      const filled = [p.currentCompanyId, p.currentSalary, p.tenureMonths].filter((v) => v != null).length;
      return filled === 0 || filled === 3;
    },
    { message: "현재 회사 정보는 회사·연봉·근속을 모두 입력해야 합니다.", path: ["currentCompanyId"] },
  );

export const progressSchema = z.object({
  index: z.number().int().min(0).max(QUESTION_COUNT),
  answers: z.array(z.enum(["A", "B"])).max(QUESTION_COUNT),
});
export type AssessmentProgress = z.infer<typeof progressSchema>;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** 읽기는 반드시 safeParse. 실패하면 키를 지우고 null (스키마 변경으로 앱이 죽는 것을 방지). */
function load<T>(key: string, schema: z.ZodType<T>): T | null {
  if (!hasStorage()) return null;
  try {
    const rawText = window.localStorage.getItem(key);
    if (!rawText) return null;
    const parsed = schema.safeParse(JSON.parse(rawText));
    if (!parsed.success) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function save(key: string, value: unknown): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — 무시 */
  }
}

function remove(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const storage = {
  loadAssessment: () => load<AssessmentResult>(STORAGE_KEYS.assessment, assessmentSchema),
  saveAssessment: (v: AssessmentResult) => save(STORAGE_KEYS.assessment, v),
  loadProfile: () => load<UserProfile>(STORAGE_KEYS.profile, profileSchema),
  saveProfile: (v: UserProfile) => save(STORAGE_KEYS.profile, v),
  loadProgress: () => load<AssessmentProgress>(STORAGE_KEYS.progress, progressSchema),
  saveProgress: (v: AssessmentProgress) => save(STORAGE_KEYS.progress, v),
  clearProgress: () => remove(STORAGE_KEYS.progress),
  clearAll: () => {
    remove(STORAGE_KEYS.assessment);
    remove(STORAGE_KEYS.profile);
    remove(STORAGE_KEYS.progress);
  },
};
