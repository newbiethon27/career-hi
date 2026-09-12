"use client";

import Link from "next/link";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ScoreHero } from "@/components/common/ScoreHero";
import { CompanyCard } from "@/components/company/CompanyCard";
import { FitBreakdown } from "@/components/company/FitBreakdown";
import { MoveTimingPanel } from "@/components/company/MoveTimingPanel";
import { RawMetricsTable } from "@/components/company/RawMetricsTable";
import { buttonVariants } from "@/components/ui/button";
import { CAREER_TYPE_META, JOB_FAMILY_LABEL } from "@/lib/constants";
import { cn, formatTenure } from "@/lib/utils";
import { useAnalysis } from "@/store/useAnalysis";
import { useGuard } from "@/store/useGuard";

/** 부가 기능: 이미 재직 중인 사용자만 사용하는 화면 (기본 플로우는 /recommend 에서 끝난다). */
export default function DashboardPage() {
  const { ready } = useGuard("current");
  const analysis = useAnalysis();
  if (!ready || !analysis?.current) return <PageSkeleton />;

  const { assessment, rec, current } = analysis;
  const profile = current.profile;
  const company = current.company;
  const avgSalary = company.metrics.avgSalaryManwon?.value ?? null;
  const salaryRatio = avgSalary ? profile.currentSalary / avgSalary : null;
  const rank = 1 + rec.ranked.filter((r) => r.fit.fit > current.fit.fit).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-sm font-semibold text-primary">현재 회사 Fit 분석</div>
          <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">
            {company.name}와(과) 당신의 적합도
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">부가 기능</span>
            <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
              {CAREER_TYPE_META[assessment.primaryType].emoji} {CAREER_TYPE_META[assessment.primaryType].label}
            </span>
            <span className="rounded-full border bg-card px-2.5 py-1 text-muted-foreground">{JOB_FAMILY_LABEL[profile.jobFamily]}</span>
            <span className="rounded-full border bg-card px-2.5 py-1 text-muted-foreground">근속 {formatTenure(profile.tenureMonths)}</span>
          </div>
        </div>
        <Link href="/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
          정보 수정
        </Link>
      </div>

      {current.isSynthetic ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          목록에 없는 회사라 비교 대상 {rec.poolSize}개사의 중앙값(업계 평균 프로필)으로 비교합니다. 원본 지표는 표시되지 않습니다.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <ScoreHero
          label="현재 회사 Fit Score"
          score={current.fit.fit}
          sub={
            <>
              비교 대상 {rec.poolSize + 1}개사 중 <span className="font-semibold text-foreground">{rank}위</span>
            </>
          }
        />
        <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
          <h2 className="text-base font-bold">내 중요도 vs 회사 점수</h2>
          <p className="mt-1 text-xs text-muted-foreground">내 비중이 높은 기준에서 회사 점수가 낮으면 그만큼 적합도가 내려가요.</p>
          <div className="mt-5">
            <FitBreakdown assessment={assessment} company={company} />
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-accent/60 p-5 text-[15px] leading-relaxed sm:p-6">
        <div className="mb-2 text-sm font-bold text-accent-foreground">한 줄로 정리하면</div>
        {current.diagnosis}
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
        <MoveTimingPanel
          result={current.moveTiming}
          currentFit={current.fit.fit}
          bestFit={rec.top[0]?.fit.fit ?? null}
          tenureMonths={profile.tenureMonths}
          salaryRatio={salaryRatio}
        />
      </section>

      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">나에게 더 맞는 회사{rec.top.length > 0 ? ` ${rec.top.length}곳` : ""}</h2>
          {rec.top.length > 0 ? (
            <Link href="/recommend" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              왜 추천했는지 보기
            </Link>
          ) : null}
        </div>
        {rec.top.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card/60 p-6 text-center text-sm leading-relaxed text-muted-foreground">
            비교 대상 {rec.poolSize}개사 중에 지금 회사보다 뚜렷하게 더 맞는 곳은 없었어요.
            <br />
            <span className="font-semibold text-foreground">지금 회사는 내 기준과 잘 맞는 편입니다.</span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {rec.top.map((t, i) => (
              <CompanyCard key={t.company.id} rank={i + 1} rec={t} baselineName={rec.baseline.label} baselineFit={rec.baseline.fit.fit} compact />
            ))}
          </div>
        )}
      </section>

      {!current.isSynthetic ? (
        <details className="group rounded-3xl border bg-card shadow-soft">
          <summary className="cursor-pointer select-none p-5 text-sm font-semibold">
            {company.name} 원본 지표 보기
            <span className="ml-2 text-xs font-normal text-muted-foreground">출처 배지와 함께</span>
          </summary>
          <div className="border-t p-5">
            <RawMetricsTable company={company} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
