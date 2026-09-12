"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/assessment", label: "성향 진단" },
  { href: "/result", label: "내 성향" },
  { href: "/profile", label: "현재 회사" },
  { href: "/dashboard", label: "적합도" },
  { href: "/recommend", label: "추천" },
  { href: "/compare", label: "비교" },
];

export function StepHeader() {
  const pathname = usePathname();
  const activeIdx = STEPS.findIndex((s) => pathname.startsWith(s.href));
  const inFlow = activeIdx >= 0;

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
          <span aria-hidden className="size-6 rounded-full bg-primary" />
          커리어<span className="text-primary">Hi</span>
        </Link>

        {inFlow ? (
          <>
            {/* 데스크톱: 단계 이름 */}
            <nav aria-label="진행 단계" className="hidden items-center gap-1 text-xs sm:flex">
              {STEPS.map((s, i) => (
                <span key={s.href} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-medium transition-colors",
                      i === activeIdx
                        ? "bg-primary text-primary-foreground"
                        : i < activeIdx
                          ? "text-foreground"
                          : "text-muted-foreground/70",
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 ? <span className="text-border">·</span> : null}
                </span>
              ))}
            </nav>
            {/* 모바일: 점 + 현재 단계 */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-xs font-medium text-muted-foreground">{STEPS[activeIdx].label}</span>
              <div className="flex items-center gap-1" aria-hidden>
                {STEPS.map((s, i) => (
                  <span
                    key={s.href}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === activeIdx ? "w-4 bg-primary" : i < activeIdx ? "w-1.5 bg-primary/50" : "w-1.5 bg-border",
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">베타</span>
        )}
      </div>
    </header>
  );
}
