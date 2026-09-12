"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { Button } from "@/components/ui/button";
import { JOB_FAMILY_LABEL, OTHER_COMPANY_ID, REGIONS } from "@/lib/constants";
import { profileSchema } from "@/lib/storage";
import { isEmployed, type JobFamily, type UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCareer } from "@/store/CareerContext";
import { useCompanies } from "@/store/CompaniesContext";
import { useGuard } from "@/store/useGuard";

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive";

interface FormState {
  jobFamily: JobFamily;
  /** 재직 중 부가 기능 사용 여부 */
  employed: boolean;
  currentCompanyId: string;
  currentSalary: string;
  tenureYears: string;
  tenureMonths: string;
  region: string;
  commuteMinutes: string;
}

const EMPTY_FORM: FormState = {
  jobFamily: "dev",
  employed: false,
  currentCompanyId: "samsung-sds",
  currentSalary: "",
  tenureYears: "",
  tenureMonths: "0",
  region: "",
  commuteMinutes: "",
};

function fromProfile(p: UserProfile): FormState {
  const employed = isEmployed(p);
  return {
    jobFamily: p.jobFamily,
    employed,
    currentCompanyId: p.currentCompanyId ?? EMPTY_FORM.currentCompanyId,
    currentSalary: p.currentSalary != null ? String(p.currentSalary) : "",
    tenureYears: p.tenureMonths != null ? String(Math.floor(p.tenureMonths / 12)) : "",
    tenureMonths: p.tenureMonths != null ? String(p.tenureMonths % 12) : "0",
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
  const { companies } = useCompanies();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const years = Number(form.tenureYears || 0);
    const months = Number(form.tenureMonths || 0);
    // 부가 기능을 끄면 현재 회사 값은 아예 저장하지 않는다 (부분 입력 상태를 만들지 않는다)
    const candidate: Record<string, unknown> = form.employed
      ? {
          jobFamily: form.jobFamily,
          currentCompanyId: form.currentCompanyId,
          currentSalary: Number(form.currentSalary),
          tenureMonths: years * 12 + months,
          region: form.region || undefined,
          commuteMinutes: form.commuteMinutes ? Number(form.commuteMinutes) : undefined,
        }
      : { jobFamily: form.jobFamily };

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
    router.push(form.employed ? "/dashboard" : "/recommend");
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <div className="mb-2 text-sm font-semibold text-primary">직군 선택</div>
      <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">어떤 직군을 목표로 하고 있나요?</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        해당 직군을 채용하는 회사만 비교합니다. 저장은 이 브라우저에만 됩니다.
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

        <section className="rounded-2xl border border-dashed p-4 sm:p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={form.employed}
              onChange={(e) => setForm((f) => ({ ...f, employed: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-semibold">
                이미 회사에 다니고 있어요
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">부가 기능</span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                체크하면 추천과 함께 현재 회사와의 적합도 분석(Fit Score · 이직 타이밍 지수)을 볼 수 있습니다.
                취업 준비 중이라면 체크하지 않아도 됩니다.
              </span>
            </span>
          </label>

          {form.employed ? (
            <div className="mt-5 space-y-6 border-t pt-5">
              <Field
                label="현재 회사"
                error={errors.currentCompanyId}
                hint={
                  form.currentCompanyId === OTHER_COMPANY_ID
                    ? `목록에 없는 회사입니다. 비교 대상 ${companies.length}개사의 중앙값(업계 평균 프로필)으로 비교합니다.`
                    : undefined
                }
              >
                <select className={inputCls} value={form.currentCompanyId} onChange={set("currentCompanyId")}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.industry}
                    </option>
                  ))}
                  <option value={OTHER_COMPANY_ID}>목록에 없음</option>
                </select>
              </Field>

              <Field label="현재 연봉" error={errors.currentSalary} hint="세전 기준. 1,000 ~ 50,000만원">
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

              <Field label="현재 회사 근속기간" error={errors.tenureMonths}>
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
            </div>
          ) : null}
        </section>

        <Button type="submit" size="xl" className="w-full">
          {form.employed ? "현재 회사 Fit 분석하기" : "나에게 맞는 회사 보기"}
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
