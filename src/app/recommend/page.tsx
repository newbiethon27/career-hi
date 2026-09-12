"use client";

import Link from "next/link";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CompanyCard } from "@/components/company/CompanyCard";
import { buttonVariants } from "@/components/ui/button";
import { CAREER_TYPE_META, MIN_FIT_MARGIN } from "@/lib/constants";
import { AXIS_LABEL } from "@/lib/types";
import { useAnalysis } from "@/store/useAnalysis";
import { useGuard } from "@/store/useGuard";

export default function RecommendPage() {
  const { ready } = useGuard("profile");
  const analysis = useAnalysis();
  if (!ready || !analysis) return <PageSkeleton />;

  const { assessment, rec } = analysis;
  const current = rec.current.company;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <div>
        <div className="text-sm text-muted-foreground">
          {CAREER_TYPE_META[assessment.primaryType].label} · {AXIS_LABEL[assessment.primaryAxis]} {assessment.percent[assessment.primaryAxis]}% ·{" "}
          {AXIS_LABEL[assessment.secondaryAxis]} {assessment.percent[assessment.secondaryAxis]}%
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">당신에게 더 맞는 회사</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {current.name}(Fit {rec.current.fit.fit})보다 적합도가 {MIN_FIT_MARGIN}점 넘게 높은 회사만, 비교 대상 {rec.poolSize}개사 중 최대 3곳을 보여줍니다.
        </p>
      </div>

      {rec.top.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <div className="text-3xl">👍</div>
          <p className="mt-3 text-base font-medium">현재 회사보다 적합도가 높은 회사가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            비교 대상 {rec.poolSize}개사 중 {current.name}보다 {MIN_FIT_MARGIN}점 넘게 높은 곳이 없습니다. 지금 회사는 당신의 성향과 잘 맞는 편입니다.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              ← 대시보드
            </Link>
            {rec.ranked[0] ? (
              <Link href={`/compare?target=${rec.ranked[0].company.id}`} className={buttonVariants({ variant: "ghost" })}>
                그래도 1위 회사({rec.ranked[0].company.name}, Fit {rec.ranked[0].fit.fit})와 비교해 보기
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rec.top.map((t, i) => (
            <CompanyCard key={t.company.id} rank={i + 1} rec={t} currentName={current.name} currentFit={rec.current.fit.fit} />
          ))}
        </div>
      )}

      <details className="rounded-2xl border bg-card">
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">
          전체 순위 보기 <span className="ml-2 text-xs font-normal text-muted-foreground">{rec.poolSize}개사</span>
        </summary>
        <div className="border-t">
          <table className="w-full text-sm">
            <tbody>
              {rec.ranked.map((r) => (
                <tr key={r.company.id} className="border-b last:border-0">
                  <td className="w-10 px-5 py-2 text-muted-foreground tabular-nums">{r.fit.rankInPool}</td>
                  <td className="py-2">
                    <Link href={`/compare?target=${r.company.id}`} className="hover:underline">
                      {r.company.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{r.company.industry}</span>
                  </td>
                  <td className="px-5 py-2 text-right font-medium tabular-nums">{r.fit.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="flex justify-between">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          ← 대시보드
        </Link>
      </div>
    </div>
  );
}
