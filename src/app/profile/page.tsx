"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Button } from "@/components/ui/button";
import { COMPANIES } from "@/lib/companies";
import { JOB_FAMILY_LABEL, OTHER_COMPANY_ID, REGIONS } from "@/lib/constants";
import { profileSchema } from "@/lib/storage";
import type { JobFamily, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCareer } from "@/store/CareerContext";
import { useGuard } from "@/store/useGuard";

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive";

interface FormState {
  jobFamily: JobFamily;
  currentCompanyId: string;
  currentSalary: string;
  tenureYears: string;
  tenureMonths: string;
  region: string;
  commuteMinutes: string;
}

const EMPTY_FORM: FormState = {
  jobFamily: "dev",
  currentCompanyId: "samsung-sds",
  currentSalary: "",
  tenureYears: "",
  tenureMonths: "0",
  region: "",
  commuteMinutes: "",
};

function fromProfile(p: UserProfile): FormState {
  return {
    jobFamily: p.jobFamily,
    currentCompanyId: p.currentCompanyId,
    currentSalary: String(p.currentSalary),
    tenureYears: String(Math.floor(p.tenureMonths / 12)),
    tenureMonths: String(p.tenureMonths % 12),
    region: p.region ?? "",
    commuteMinutes: p.commuteMinutes != null ? String(p.commuteMinutes) : "",
  };
}

export default function ProfilePage() {
  const { ready } = useGuard("assessment");
  const { profile } = useCareer();
  // hydrate 이후에만 폼을 마운트 → 기존 프로필로 lazy init (effect 내 setState 불필요)
  if (!ready) return <PageSkeleton />;
  return <ProfileForm initial={profile ? fromProfile(profile) : EMPTY_FORM} />;
}

function ProfileForm({ initial }: { initial: FormState }) {
  const { setProfile } = useCareer();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const years = Number(form.tenureYears || 0);
    const months = Number(form.tenureMonths || 0);
    const candidate = {
      jobFamily: form.jobFamily,
      currentCompanyId: form.currentCompanyId,
      currentSalary: Number(form.currentSalary),
      tenureMonths: years * 12 + months,
      region: form.region || undefined,
      commuteMinutes: form.commuteMinutes ? Number(form.commuteMinutes) : undefined,
    };
    const parsed = profileSchema.safeParse(candidate);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        errs[key] = MESSAGES[key] ?? issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setProfile(parsed.data);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <div className="mb-2 text-sm font-semibold text-primary">현재 회사</div>
      <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">지금 다니는 회사를 알려주세요</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        내 기준으로 지금 회사가 얼마나 맞는지 계산하는 데 필요한 최소 정보예요. 입력한 내용은 이 브라우저에만 저장됩니다.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border bg-card p-5 shadow-soft sm:p-7" noValidate>
        <Field label="직군" error={errors.jobFamily}>
          <select className={inputCls} value={form.jobFamily} onChange={set("jobFamily")}>
            {(Object.keys(JOB_FAMILY_LABEL) as JobFamily[]).map((k) => (
              <option key={k} value={k}>
                {JOB_FAMILY_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="현재 회사"
          error={errors.currentCompanyId}
          hint={
            form.currentCompanyId === OTHER_COMPANY_ID
              ? `목록에 없는 회사는 비교 대상 ${COMPANIES.length}개사의 중앙값(업계 평균 프로필)으로 비교해요.`
              : undefined
          }
        >
          <select className={inputCls} value={form.currentCompanyId} onChange={set("currentCompanyId")}>
            {COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.industry}
              </option>
            ))}
            <option value={OTHER_COMPANY_ID}>목록에 없음</option>
          </select>
        </Field>

        <Field label="현재 연봉" error={errors.currentSalary} hint="세전 기준, 만원 단위로 입력해 주세요.">
          <UnitInput unit="만원">
            <input
              type="number"
              inputMode="numeric"
              className={cn(inputCls, "pr-16")}
              placeholder="예: 7000"
              value={form.currentSalary}
              onChange={set("currentSalary")}
              aria-invalid={!!errors.currentSalary}
            />
          </UnitInput>
        </Field>

        <Field label="현재 회사에서 일한 기간" error={errors.tenureMonths}>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput unit="년">
              <input
                type="number"
                inputMode="numeric"
                className={cn(inputCls, "pr-10")}
                placeholder="0"
                min={0}
                max={40}
                value={form.tenureYears}
                onChange={set("tenureYears")}
              />
            </UnitInput>
            <UnitInput unit="개월">
              <input
                type="number"
                inputMode="numeric"
                className={cn(inputCls, "pr-14")}
                placeholder="0"
                min={0}
                max={11}
                value={form.tenureMonths}
                onChange={set("tenureMonths")}
              />
            </UnitInput>
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="근무 지역" optional>
            <select className={inputCls} value={form.region} onChange={set("region")}>
              <option value="">선택 안 함</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="편도 통근 시간" optional error={errors.commuteMinutes}>
            <UnitInput unit="분">
              <input
                type="number"
                inputMode="numeric"
                className={cn(inputCls, "pr-10")}
                placeholder="예: 45"
                value={form.commuteMinutes}
                onChange={set("commuteMinutes")}
              />
            </UnitInput>
          </Field>
        </div>

        <Button type="submit" size="xl" className="w-full">
          지금 회사와의 적합도 보기
        </Button>
      </form>
    </div>
  );
}

const MESSAGES: Record<string, string> = {
  currentSalary: "연봉은 1,000만원 이상 50,000만원 이하로 입력해 주세요.",
  tenureMonths: "근속기간은 0 ~ 40년 범위로 입력해 주세요.",
  commuteMinutes: "통근 시간은 0 ~ 180분 범위로 입력해 주세요.",
  currentCompanyId: "현재 회사를 선택해 주세요.",
};

/** 숫자 입력 오른쪽에 단위(만원/년/분)를 붙인다. 자식 input 에 pr-* 여백을 직접 준다. */
function UnitInput({ unit, children }: { unit: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">{unit}</span>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {label}
        {optional ? <span className="text-xs font-normal text-muted-foreground">(선택)</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
