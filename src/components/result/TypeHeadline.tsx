import { CAREER_TYPE_META } from "@/lib/constants";
import type { AssessmentResult } from "@/lib/types";

export function TypeHeadline({ result }: { result: AssessmentResult }) {
  const p = CAREER_TYPE_META[result.primaryType];
  const s = CAREER_TYPE_META[result.secondaryType];
  return (
    <div className="rounded-3xl border bg-card px-6 py-8 text-center shadow-soft sm:px-8">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-3xl" aria-hidden>
        {p.emoji}
      </div>
      <div className="mt-4 text-sm font-medium text-muted-foreground">당신이 회사를 고르는 기준은</div>
      <h1 className="mt-2 text-[2rem] font-bold tracking-tight sm:text-4xl">
        <span className="text-highlight">{p.label}</span>
      </h1>
      {result.isMixed ? (
        <div className="mt-3 inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
          {p.label.replace(" 추구형", "")}·{s.label.replace(" 추구형", "")} 혼합형
        </div>
      ) : null}
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{p.tagline}</p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-sm">
        <span className="text-muted-foreground">그다음으로는</span>
        <span className="font-semibold">
          {s.emoji} {s.label.replace(" 추구형", "")}
        </span>
      </div>
    </div>
  );
}
