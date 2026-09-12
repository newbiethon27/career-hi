"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CompareTable } from "@/components/compare/CompareTable";
import { RawMetricsTable } from "@/components/company/RawMetricsTable";
import { buttonVariants } from "@/components/ui/button";
import { getCompany } from "@/lib/companies";
import { buildCompareSummary } from "@/lib/explain";
import { computeFit } from "@/lib/fit";
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
  if (!ready || !analysis) return <PageSkeleton />;

  const { assessment, rec } = analysis;
  const current = rec.current.company;

  // target 이 없거나 잘못되면 추천 1위 → 없으면 풀 1위
  const requested = params.get("target");
  const fallback = rec.top[0]?.company ?? rec.ranked[0]?.company ?? null;
  const target = (requested ? getCompany(requested) : null) ?? fallback;

  if (!target || target.id === current.id) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">비교할 회사를 찾을 수 없습니다.</p>
        <Link href="/recommend" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
          추천 목록으로
        </Link>
      </div>
    );
  }

  const targetFit = computeFit(assessment.weights, target.scores, target.id).fit;
  const fitDelta = targetFit - rec.current.fit.fit;
  const summary = buildCompareSummary(assessment, current, target, fitDelta);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <div>
        <div className="text-sm text-muted-foreground">현재 회사 vs 비교 대상</div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {current.name} <span className="text-muted-foreground">vs</span> {target.name}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {rec.top.map((t) => (
          <Link
            key={t.company.id}
            href={`/compare?target=${t.company.id}`}
            className={buttonVariants({ variant: t.company.id === target.id ? "default" : "outline", size: "sm" })}
          >
            {t.company.name} {t.fit.fit}
          </Link>
        ))}
      </div>

      <CompareTable current={current} target={target} currentFit={rec.current.fit.fit} targetFit={targetFit} />

      <section className="rounded-2xl border-l-4 border-primary bg-primary/5 p-5 text-[15px] leading-relaxed">{summary}</section>

      <details className="rounded-2xl border bg-card">
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">{target.name} 원본 지표 보기</summary>
        <div className="border-t p-5">
          <RawMetricsTable company={target} />
        </div>
      </details>

      <div className="flex justify-between">
        <Link href="/recommend" className={buttonVariants({ variant: "ghost" })}>
          ← 추천 목록
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          대시보드
        </Link>
      </div>
    </div>
  );
}
