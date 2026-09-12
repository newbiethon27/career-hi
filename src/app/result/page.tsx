"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { AxisBreakdown } from "@/components/result/AxisBreakdown";
import { TypeHeadline } from "@/components/result/TypeHeadline";
import { Button, buttonVariants } from "@/components/ui/button";
import { CAREER_TYPE_META, DISCLAIMER } from "@/lib/constants";
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
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <TypeHeadline result={assessment} />

      <section className="mt-10 rounded-2xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">4가지 성향 점수</h2>
        <AxisBreakdown result={assessment} />
        <p className="mt-3 text-xs text-muted-foreground">10문항 응답에서 각 축이 선택된 비율입니다 (합 100%).</p>
      </section>

      <section className="mt-6 space-y-3 text-[15px] leading-relaxed">
        <p>{meta.description}</p>
      </section>

      <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        {DISCLAIMER.assessment}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/profile" className={cn(buttonVariants({ size: "lg" }), "h-11 flex-1 text-base")}>
          나에게 맞는 회사 보기 →
        </Link>
        <Button
          variant="ghost"
          size="lg"
          className="h-11"
          onClick={() => {
            reset();
            router.push("/assessment");
          }}
        >
          다시 검사하기
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        이미 회사에 다니고 있다면 다음 단계에서 현재 회사와의 적합도 분석(부가 기능)도 함께 볼 수 있습니다.
      </p>
    </div>
  );
}
