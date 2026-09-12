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

export const profileSchema = z.object({
  jobFamily: z.enum(["dev", "data", "pm", "design", "marketing"]),
  currentCompanyId: z.string().min(1),
  currentSalary: z.number().min(1000).max(50000),
  tenureMonths: z.number().int().min(0).max(480),
  region: z.string().optional(),
  commuteMinutes: z.number().int().min(0).max(180).optional(),
});

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
