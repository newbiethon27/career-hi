"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CompareTable } from "@/components/compare/CompareTable";
import { RawMetricsTable } from "@/components/company/RawMetricsTable";
import { buttonVariants } from "@/components/ui/button";
import { buildCompareSummary } from "@/lib/explain";
import { computeFit } from "@/lib/fit";
import { cn } from "@/lib/utils";
import { useCompany } from "@/store/CompaniesContext";
import { useAnalysis } from "@/store/useAnalysis";
import { useGuard } from "@/store/useGuard";

export default function ComparePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const { ready } = useGuard("profile");
  const analysis = useAnalysis();
  const params = useSearchParams();
  const requested = params.get("target");
  const requestedCompany = useCompany(requested); // 훅은 early return 앞에서
  if (!ready || !analysis) return <PageSkeleton />;

  // 비교 기준: 재직자는 현재 회사, 구직자는 업계 평균
  const { assessment, rec } = analysis;
  const baseline = rec.baseline;

  // target 이 없거나 잘못되면 추천 1위 → 없으면 풀 1위
  const fallback = rec.top[0]?.company ?? rec.ranked[0]?.company ?? null;
  const target = requestedCompany ?? fallback;

  if (!target || target.id === baseline.company.id) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">비교할 회사를 찾을 수 없어요.</p>
        <Link href="/recommend" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-4")}>
          추천 목록으로
        </Link>
      </div>
    );
  }

  const targetFit = computeFit(assessment.weights, target.scores, target.id).fit;
  const fitDelta = targetFit - baseline.fit.fit;
  const summary = buildCompareSummary(assessment, { company: baseline.company, label: baseline.label }, target, fitDelta);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <div>
        <div className="mb-1 text-sm font-semibold text-primary">{baseline.label} vs 비교 대상</div>
        <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">
          {baseline.company.name} <span className="font-normal text-muted-foreground">vs</span> {target.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">두 회사를 나란히 두면 내 기준이 더 선명해져요. 초록 숫자가 비교 회사가 앞서는 항목입니다.</p>
      </div>

      {rec.top.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {rec.top.map((t) => (
            <Link
              key={t.company.id}
              href={`/compare?target=${t.company.id}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                t.company.id === target.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:border-primary/50 hover:bg-accent/40",
              )}
            >
              {t.company.name} <span className="tabular-nums opacity-80">{t.fit.fit}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <CompareTable base={baseline.company} baseLabel={baseline.label} target={target} baseFit={baseline.fit.fit} targetFit={targetFit} />

      <section className="rounded-3xl bg-accent/60 p-5 text-[15px] leading-relaxed sm:p-6">
        <div className="mb-2 text-sm font-bold text-accent-foreground">정리하면</div>
        {summary}
      </section>

      <details className="rounded-3xl border bg-card shadow-soft">
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">{target.name}의 원본 숫자 보기</summary>
        <div className="border-t p-5">
          <RawMetricsTable company={target} />
        </div>
      </details>

      <div className="flex justify-between">
        <Link href="/recommend" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          추천 목록으로
        </Link>
        {rec.current ? (
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            현재 회사 Fit 분석
          </Link>
        ) : null}
      </div>
    </div>
  );
}
