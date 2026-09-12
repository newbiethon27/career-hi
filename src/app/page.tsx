import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DemoPresets } from "@/components/landing/DemoPresets";
import { QUESTION_COUNT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CRITERIA = ["보상", "워라밸", "고용 안정", "회사 성장"];

const STEPS = [
  {
    title: "내가 중요하게 보는 기준 찾기",
    desc: "둘 중 하나를 고르는 질문에 답하면, 보상·균형·안정·성장 중 무엇을 먼저 보는지 정리됩니다.",
  },
  {
    title: "지금 회사와 얼마나 맞는지 확인",
    desc: "내 기준으로 지금 다니는 회사를 점수로 확인합니다. 점수가 나온 이유도 함께 보여드려요.",
  },
  {
    title: "나에게 더 맞는 회사 보기",
    desc: "같은 기준으로 다른 회사를 비교해, 더 맞는 곳이 있으면 이유와 주의할 점을 함께 알려드려요.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
      <section className="space-y-7">
        <h1 className="text-[2rem] font-bold leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3]">
          나에게 맞는 회사는
          <br />
          연봉만으로 <span className="text-highlight text-primary">정해지지 않으니까</span>
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다. 내가 무엇을 중요하게 보는지 먼저 알아보고, 지금 회사와
          얼마나 맞는지 점수와 이유로 확인해 보세요.
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
        <div className="text-[15px] font-bold">결과를 먼저 구경해 볼까요?</div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          같은 회사, 같은 직군, 같은 연봉인 두 사람입니다. 중요하게 보는 기준만 다를 때 결과가 어떻게 달라지는지 바로 볼 수
          있어요.
        </p>
        <DemoPresets />
      </section>
    </div>
  );
}
