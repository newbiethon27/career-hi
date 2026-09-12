"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/assessment", label: "성향 진단" },
  { href: "/result", label: "유형 결과" },
  { href: "/profile", label: "현재 회사" },
  { href: "/dashboard", label: "Fit 분석" },
  { href: "/recommend", label: "추천" },
  { href: "/compare", label: "비교" },
];

export function StepHeader() {
  const pathname = usePathname();
  const activeIdx = STEPS.findIndex((s) => pathname.startsWith(s.href));
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight">
          커리어<span className="text-primary">Hi</span>
        </Link>
        <nav className="hidden items-center gap-1 text-xs sm:flex">
          {STEPS.map((s, i) => (
            <span key={s.href} className="flex items-center gap-1">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5",
                  i === activeIdx
                    ? "bg-primary text-primary-foreground"
                    : i < activeIdx
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? <span className="text-muted-foreground/50">›</span> : null}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
