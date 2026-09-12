"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { AxisBreakdown } from "@/components/result/AxisBreakdown";
import { TypeHeadline } from "@/components/result/TypeHeadline";
import { Button, buttonVariants } from "@/components/ui/button";
import { CAREER_TYPE_META, DISCLAIMER, QUESTION_COUNT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCareer } from "@/store/CareerContext";
import { useGuard } from "@/store/useGuard";

export default function ResultPage() {
  const { ready } = useGuard("assessment");
  const { assessment, reset } = useCareer();
  const router = useRouter();
  if (!ready || !assessment) return <PageSkeleton />;

  const meta = CAREER_TYPE_META[assessment.primaryType];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-6 text-sm font-semibold text-primary">진단 결과</div>
      <TypeHeadline result={assessment} />

      <section className="mt-5 rounded-3xl border bg-card p-6 shadow-soft">
        <h2 className="text-base font-bold">네 가지 기준, 내 비중은</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {QUESTION_COUNT}개 답변에서 각 기준을 고른 비율입니다. 합치면 100%예요.
        </p>
        <div className="mt-5">
          <AxisBreakdown result={assessment} />
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-accent/60 p-6 text-[15px] leading-relaxed">
        <div className="mb-2 text-sm font-bold text-accent-foreground">이런 분이에요</div>
        <p>{meta.description}</p>
      </section>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/profile" className={cn(buttonVariants({ size: "xl" }), "w-full")}>
          나에게 맞는 회사 보기
        </Link>
        <Button
          variant="ghost"
          size="lg"
          className="text-muted-foreground"
          onClick={() => {
            reset();
            router.push("/assessment");
          }}
        >
          답변 다시 하기
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        이미 회사에 다니고 있다면 다음 단계에서 현재 회사와의 적합도 분석(부가 기능)도 함께 볼 수 있습니다.
      </p>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER.assessment}</p>
    </div>
  );
}
