import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DemoPresets } from "@/components/landing/DemoPresets";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "①", title: "성향 진단", desc: "10개의 trade-off 질문으로 보상·균형·안정·성장 중 무엇을 우선하는지 파악합니다." },
  { n: "②", title: "맞는 회사 추천", desc: "같은 기준으로 점수화한 회사 중 내 성향에 맞는 곳을 이유·주의점과 함께 TOP 3로 제시합니다." },
  { n: "③", title: "회사 비교", desc: "관심 있는 회사를 보상·균형·안정·성장 네 축과 공시 원본 지표로 나란히 비교합니다." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
      <section className="space-y-6 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Career Decision Service · 설명 가능한 추천
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          어디에 지원해야 할지 모르겠다면
          <br />
          <span className="text-primary">기준부터 만들고 시작하세요</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          10개 질문으로 커리어 성향을 진단하고, 그 기준으로 점수화한 회사 중 나에게 맞는 곳을 이유와 함께 추천받으세요. 약 2분.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/assessment" className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base")}>
            진단 시작하기
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border bg-card p-5">
            <div className="text-2xl font-bold text-primary">{s.n}</div>
            <div className="mt-2 text-base font-semibold">{s.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-dashed p-5">
        <div className="text-sm font-semibold">데모로 바로 보기</div>
        <p className="mt-1 text-sm text-muted-foreground">
          같은 직군·같은 조건의 두 사람. 성향만 다르면 추천이 어떻게 달라지는지 바로 확인합니다.
        </p>
        <DemoPresets />
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5">
        <div className="text-sm font-semibold">
          이미 회사에 다니고 있나요?
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">부가 기능</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          진단 후 현재 회사 정보를 추가로 입력하면, 지금 다니는 회사와의 적합도 점수와 이직 타이밍 지수도 함께 확인할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
