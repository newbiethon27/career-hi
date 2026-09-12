"use client";

import Link from "next/link";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CompanyCard } from "@/components/company/CompanyCard";
import { RankingTable } from "@/components/company/RankingTable";
import { buttonVariants } from "@/components/ui/button";
import { CAREER_TYPE_META, MIN_FIT_MARGIN } from "@/lib/constants";
import { JOB_FAMILY_LABEL } from "@/lib/constants";
import { AXIS_LABEL } from "@/lib/types";
import { useAnalysis } from "@/store/useAnalysis";
import { useGuard } from "@/store/useGuard";

export default function RecommendPage() {
  const { ready } = useGuard("profile");
  const analysis = useAnalysis();
  if (!ready || !analysis) return <PageSkeleton />;

  const { assessment, profile, rec } = analysis;
  const { baseline } = rec;
  const current = rec.current;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <div>
        <div className="mb-1 text-sm font-semibold text-primary">추천 회사</div>
        <h1 className="text-[1.75rem] font-bold leading-snug tracking-tight sm:text-3xl">당신에게 맞는 회사</h1>
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
          {current ? (
            <>
              {current.company.name}(Fit {current.fit.fit})보다 적합도가 {MIN_FIT_MARGIN}점 넘게 높은 회사만, 비교 대상 {rec.poolSize}개사 중 최대 3곳을 보여줍니다.
            </>
          ) : (
            <>
              {JOB_FAMILY_LABEL[profile.jobFamily]} 직군을 채용하는 {rec.poolSize}개사를 당신의 성향 가중치로 점수화해 상위 3곳을 보여줍니다. 점수 옆 숫자는 업계 평균(Fit{" "}
              {baseline.fit.fit}) 대비 차이입니다.
            </>
          )}
        </p>
      </div>

      {rec.top.length === 0 ? (
        current ? (
          <div className="rounded-3xl border border-dashed bg-card/60 p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-2xl">👍</div>
            <p className="mt-4 text-base font-bold">현재 회사보다 적합도가 높은 회사가 없습니다.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              비교 대상 {rec.poolSize}개사 중 {current.company.name}보다 {MIN_FIT_MARGIN}점 넘게 높은 곳이 없습니다. 지금 회사는 당신의 성향과 잘 맞는 편입니다.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
                현재 회사 Fit 분석
              </Link>
              {rec.ranked[0] ? (
                <Link href={`/compare?target=${rec.ranked[0].company.id}`} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                  그래도 1위 회사({rec.ranked[0].company.name}, Fit {rec.ranked[0].fit.fit})와 비교해 보기
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed bg-card/60 p-8 text-center">
            <p className="text-base font-bold">{JOB_FAMILY_LABEL[profile.jobFamily]} 직군을 채용하는 비교 대상 회사가 없습니다.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">현재 데이터셋에 해당 직군 회사가 부족합니다. 다른 직군으로 바꿔 보세요.</p>
            <Link href="/profile" className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-6`}>
              직군 다시 선택하기
            </Link>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {rec.top.map((t, i) => (
            <CompanyCard key={t.company.id} rank={i + 1} rec={t} baselineName={baseline.label} baselineFit={baseline.fit.fit} />
          ))}
        </div>
      )}

      <details className="rounded-3xl border bg-card shadow-soft">
        <summary className="cursor-pointer select-none p-5 text-sm font-semibold">
          전체 순위 보기 <span className="ml-2 text-xs font-normal text-muted-foreground">{rec.poolSize}개사</span>
        </summary>
        <div className="border-t">
          <RankingTable ranked={rec.ranked} assessment={assessment} baselineLabel={baseline.label} baselineFit={baseline.fit.fit} />
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">회사 이름을 누르면 축별 점수와 근거를 펼쳐 볼 수 있습니다.</p>
      </details>

      {current ? (
        <div className="flex justify-between">
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            현재 회사 Fit 분석
          </Link>
          <Link href="/profile" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            조건 수정
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-5 sm:p-6">
          <div className="text-sm font-semibold">
            이미 회사에 다니고 있나요?
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">부가 기능</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            현재 회사 정보를 입력하면 지금 회사와의 적합도 점수와 이직 타이밍 지수를 함께 볼 수 있습니다.
          </p>
          <Link href="/profile" className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-4`}>
            현재 회사 적합도 확인하기
          </Link>
        </div>
      )}
    </div>
  );
}
