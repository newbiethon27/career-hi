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
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <div>
        <div className="mb-1 text-sm font-semibold text-primary">추천 회사</div>
        <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">나에게 더 맞는 회사</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
            {CAREER_TYPE_META[assessment.primaryType].emoji} {CAREER_TYPE_META[assessment.primaryType].label}
          </span>
          <span className="rounded-full border bg-card px-2.5 py-1 text-muted-foreground">
            {AXIS_LABEL[assessment.primaryAxis]} {assessment.percent[assessment.primaryAxis]}% · {AXIS_LABEL[assessment.secondaryAxis]}{" "}
            {assessment.percent[assessment.secondaryAxis]}%
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {current.name}(적합도 {rec.current.fit.fit}점)보다 {MIN_FIT_MARGIN}점 넘게 더 맞는 회사만 골랐어요. 비교 대상 {rec.poolSize}개사
          중 최대 3곳입니다.
        </p>
      </div>

      {rec.top.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card/60 p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-2xl">👍</div>
          <p className="mt-4 text-base font-bold">지금 회사보다 뚜렷하게 더 맞는 곳이 없어요</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            비교 대상 {rec.poolSize}개사 중 {current.name}보다 {MIN_FIT_MARGIN}점 넘게 높은 회사가 없었습니다. 지금 회사는 내 기준과 잘 맞는
            편이에요.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
              적합도 화면으로
            </Link>
            {rec.ranked[0] ? (
              <Link href={`/compare?target=${rec.ranked[0].company.id}`} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                그래도 1위인 {rec.ranked[0].company.name}과 비교해 보기
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

      <details className="rounded-3xl border bg-card shadow-soft">
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">
          전체 순위 보기 <span className="ml-2 text-xs font-normal text-muted-foreground">{rec.poolSize}개사</span>
        </summary>
        <div className="border-t">
          <table className="w-full text-sm">
            <tbody>
              {rec.ranked.map((r) => (
                <tr key={r.company.id} className="border-b last:border-0">
                  <td className="w-12 px-5 py-2.5 text-muted-foreground tabular-nums">{r.fit.rankInPool}</td>
                  <td className="py-2.5">
                    <Link href={`/compare?target=${r.company.id}`} className="font-medium hover:underline">
                      {r.company.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{r.company.industry}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{r.fit.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="flex justify-between">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          적합도 화면으로
        </Link>
      </div>
    </div>
  );
}
