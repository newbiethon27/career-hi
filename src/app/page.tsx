import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DemoPresets } from "@/components/landing/DemoPresets";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "①", title: "성향 진단", desc: "10개의 trade-off 질문으로 보상·균형·안정·성장 중 무엇을 우선하는지 파악합니다." },
  { n: "②", title: "현재 회사 Fit 분석", desc: "지금 다니는 회사가 내 성향과 얼마나 맞는지 0~100 점수와 근거로 확인합니다." },
  { n: "③", title: "맞는 회사 추천", desc: "같은 기준으로 점수화한 회사 중 더 적합한 곳을 이유·주의점과 함께 제시합니다." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
      <section className="space-y-6 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Career Decision Service · 설명 가능한 추천
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          같은 직무, 같은 연봉이어도
          <br />
          <span className="text-primary">좋은 회사는 사람마다 다릅니다</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          10개 질문으로 당신의 커리어 성향을 진단하고, 지금 회사와의 적합도를 점수로 확인하세요. 약 2분.
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
          같은 회사·같은 직군·같은 연봉의 두 개발자. 성향만 다르면 결과가 어떻게 달라지는지 바로 확인합니다.
        </p>
        <DemoPresets />
      </section>
    </div>
  );
}
