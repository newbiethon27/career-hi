"use client";

import { useRouter } from "next/navigation";
import { PRESETS, type PresetId } from "@/lib/presets";
import { useCareer } from "@/store/CareerContext";

/** 시연용: 사전 정의된 검사+프로필을 주입하고 추천 화면으로 직행 (검사 재응시 90초를 없앤다). */
export function DemoPresets() {
  const { loadPreset } = useCareer();
  const router = useRouter();
  const go = (id: PresetId) => {
    loadPreset(id);
    router.push("/recommend");
  };
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {(Object.keys(PRESETS) as PresetId[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          className="group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold">{PRESETS[id].title}의 결과 보기</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">{PRESETS[id].subtitle}</div>
          </div>
          <span aria-hidden className="text-lg text-primary transition-transform group-hover:translate-x-0.5">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}
