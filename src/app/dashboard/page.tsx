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

export default function DashboardPage() {
  const { ready } = useGuard("profile");
  const analysis = useAnalysis();
  if (!ready || !analysis) return <PageSkeleton />;

  const { assessment, profile, rec, moveTiming, diagnosis } = analysis;
  const current = rec.current.company;
  const avgSalary = current.metrics.avgSalaryManwon?.value ?? null;
  const salaryRatio = avgSalary ? profile.currentSalary / avgSalary : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {CAREER_TYPE_META[assessment.primaryType].emoji} {CAREER_TYPE_META[assessment.primaryType].label} · {JOB_FAMILY_LABEL[profile.jobFamily]} · 근속{" "}
            {formatTenure(profile.tenureMonths)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{current.name}와(과) 당신의 적합도</h1>
        </div>
        <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          정보 수정
        </Link>
      </div>

      {rec.current.isSynthetic ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          목록에 없는 회사라 비교 대상 {rec.poolSize}개사의 중앙값(업계 평균 프로필)으로 비교합니다. 원본 지표는 표시되지 않습니다.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ScoreHero
          label="현재 회사 Fit Score"
          score={rec.current.fit.fit}
          sub={
            <>
              비교 대상 {rec.poolSize + 1}개사 중{" "}
              <span className="font-medium text-foreground">{1 + rec.ranked.filter((r) => r.fit.fit > rec.current.fit.fit).length}위</span>
            </>
          }
        />
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">내 중요도 vs 회사 점수</h2>
          <FitBreakdown assessment={assessment} company={current} />
        </section>
      </div>

      <section className="rounded-2xl border-l-4 border-primary bg-primary/5 p-5 text-[15px] leading-relaxed">{diagnosis}</section>

      <section className="rounded-2xl border bg-card p-5">
        <MoveTimingPanel
          result={moveTiming}
          currentFit={rec.current.fit.fit}
          bestFit={rec.top[0]?.fit.fit ?? null}
          tenureMonths={profile.tenureMonths}
          salaryRatio={salaryRatio}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">더 적합한 회사 {rec.top.length > 0 ? `TOP ${rec.top.length}` : ""}</h2>
          {rec.top.length > 0 ? (
            <Link href="/recommend" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              추천 이유 자세히 보기 →
            </Link>
          ) : null}
        </div>
        {rec.top.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            현재 회사보다 적합도가 유의미하게 높은 회사가 비교 대상 {rec.poolSize}개사 중 없습니다.
            <br />
            <span className="font-medium text-foreground">지금 회사는 당신의 성향과 잘 맞는 편입니다.</span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {rec.top.map((t, i) => (
              <CompanyCard key={t.company.id} rank={i + 1} rec={t} currentName={current.name} currentFit={rec.current.fit.fit} compact />
            ))}
          </div>
        )}
      </section>

      {!rec.current.isSynthetic ? (
        <details className="group rounded-2xl border bg-card">
          <summary className="cursor-pointer select-none p-5 text-sm font-semibold">
            {current.name} 원본 지표 보기
            <span className="ml-2 text-xs font-normal text-muted-foreground">출처 배지와 함께</span>
          </summary>
          <div className="border-t p-5">
            <RawMetricsTable company={current} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
