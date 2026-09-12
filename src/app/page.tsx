import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DemoPresets } from "@/components/landing/DemoPresets";
import { QUESTION_COUNT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CRITERIA = ["보상", "워라밸", "고용 안정", "회사 성장"];

const STEPS = [
  { title: "성향 진단", desc: "10개의 trade-off 질문으로 보상·균형·안정·성장 중 무엇을 우선하는지 파악합니다." },
  { title: "맞는 회사 추천", desc: "같은 기준으로 점수화한 회사 중 내 성향에 맞는 곳을 이유·주의점과 함께 TOP 3로 제시합니다." },
  { title: "회사 비교", desc: "관심 있는 회사를 보상·균형·안정·성장 네 축과 공시 원본 지표로 나란히 비교합니다." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
      <section className="space-y-7">
        <h1 className="text-[2rem] font-bold leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3]">
          어디에 지원해야 할지 모르겠다면
          <br />
          <span className="text-highlight text-primary">기준부터 만들고 시작하세요</span>
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          10개 질문으로 커리어 성향을 진단하고, 그 기준으로 점수화한 회사 중 나에게 맞는 곳을 이유와 함께 추천받으세요. 약 2분.
        </p>
        <div className="flex flex-wrap gap-2">
          {CRITERIA.map((c) => (
            <span key={c} className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground">
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-1 sm:max-w-xs">
          <Link href="/assessment" className={cn(buttonVariants({ size: "xl" }), "w-full")}>
            2분 만에 진단 시작하기
          </Link>
          <p className="text-center text-[13px] text-muted-foreground">
            질문 {QUESTION_COUNT}개 · 가입 없이 바로 · 결과는 이 브라우저에만 저장
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-bold">이렇게 진행돼요</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {i + 1}
              </div>
              <div className="mt-3 text-[15px] font-bold leading-snug">{s.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 rounded-2xl border border-dashed border-primary/30 bg-card/60 p-5 sm:p-6">
        <div className="text-[15px] font-bold">데모로 바로 보기</div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          같은 직군·같은 조건의 두 사람. 성향만 다르면 추천이 어떻게 달라지는지 바로 확인합니다.
        </p>
        <DemoPresets />
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="text-sm font-semibold">
          이미 회사에 다니고 있나요?
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">부가 기능</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          진단 후 현재 회사 정보를 추가로 입력하면, 지금 다니는 회사와의 적합도 점수와 이직 타이밍 지수도 함께 확인할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
