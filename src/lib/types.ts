// ---------- 축 ----------
export const AXES = ["compensation", "balance", "stability", "growth"] as const;
export type Axis = (typeof AXES)[number];
export type AxisVector = Record<Axis, number>;

export const AXIS_LABEL: Record<Axis, string> = {
  compensation: "보상",
  balance: "균형",
  stability: "안정",
  growth: "성장",
};

// ---------- 출처 ----------
// dart    : OpenDART 스냅샷 원본
// manual  : 사람이 입력한 값 (Balance, 데모 자리표시자 등)
// derived : 위 둘로부터 계산·보간된 값
export type DataSource = "dart" | "manual" | "derived";

export interface Sourced<T> {
  value: T;
  source: DataSource;
  asOf?: string;
  note?: string;
}

// ---------- 성향 검사 ----------
export type Answer = "A" | "B";

export interface Question {
  id: number; // 1..10
  text: string;
  optionA: { label: string; axis: Axis };
  optionB: { label: string; axis: Axis };
}

export type CareerType =
  | "compensation_seeker"
  | "balance_seeker"
  | "stability_seeker"
  | "growth_seeker";

export interface AssessmentResult {
  answers: Answer[];
  raw: AxisVector; // 각 0..10, 합 = 20
  percent: AxisVector; // 각 0..50, 합 = 100 (표시용)
  weights: AxisVector; // 각 0..1, 합 = 1 (Fit 계산용, smoothing 적용)
  primaryAxis: Axis;
  secondaryAxis: Axis;
  primaryType: CareerType;
  secondaryType: CareerType;
  isMixed: boolean; // top1 - top2 < 5%p
  completedAt: string; // ISO
}

// ---------- 사용자 프로필 ----------
export type JobFamily = "dev" | "data" | "pm" | "design" | "marketing";

export interface UserProfile {
  jobFamily: JobFamily;
  // ↓ 재직자 부가 기능(현재 회사 Fit 분석)에서만 채운다. 구직자는 모두 undefined.
  currentCompanyId?: string; // "other" 가능
  currentSalary?: number; // 만원
  tenureMonths?: number;
  region?: string;
  commuteMinutes?: number;
}

/** 현재 회사 정보를 모두 채운 프로필. 부가 기능 화면은 이 타입만 받는다. */
export interface EmployedProfile extends UserProfile {
  currentCompanyId: string;
  currentSalary: number;
  tenureMonths: number;
}

/** 세 값은 항상 함께 저장된다 (storage.profileSchema 가 보장). */
export function isEmployed(p: UserProfile): p is EmployedProfile {
  return p.currentCompanyId != null && p.currentSalary != null && p.tenureMonths != null;
}

// ---------- 회사 ----------
export interface CompanyRawMetrics {
  avgSalaryManwon: Sourced<number> | null; // 1인 평균 급여액 (만원)
  avgTenureYears: Sourced<number> | null;
  employeeCount: Sourced<number> | null;
  employeeCountPrev: Sourced<number> | null;
  revenue: Sourced<number> | null; // 백만원
  revenuePrev: Sourced<number> | null;
  operatingProfit: Sourced<number> | null;
  operatingProfitPrev: Sourced<number> | null;
  worklifeIndex: Sourced<number> | null; // 0..100, 항상 manual
}

export interface Company {
  id: string;
  name: string;
  corpCode?: string;
  industry: string;
  jobFamilies: JobFamily[];
  metrics: CompanyRawMetrics;
}

export interface ScoredCompany extends Company {
  scores: AxisVector; // 각 0..100
  scoreSources: Record<Axis, DataSource>;
  missingAxes: Axis[]; // 원본 지표 부재로 보간된 축
}

// ---------- 결과 ----------
export interface FitResult {
  companyId: string;
  fit: number; // 0..100 정수
  contributions: AxisVector; // weight × score, 합 ≈ fit
  rankInPool?: number;
}

export interface Recommendation {
  company: ScoredCompany;
  fit: FitResult;
  fitDelta: number;
  reasons: string[];
  cautions: string[];
}

export type MoveBand = "stay" | "watch" | "consider";

export interface MoveTimingResult {
  score: number; // 0..100
  band: MoveBand;
  components: {
    fitGap: number; // 0..40
    currentFitPenalty: number; // 0..25
    tenureReadiness: number; // 0..20
    salaryGap: number; // 0..15
  };
  maxScore: number; // 100, avgSalary 결측 시 85 → 100으로 재정규화
  notes: string[]; // 계산에 적용된 예외 설명
  summary: string;
}
