"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
          className={cn(buttonVariants({ variant: "outline" }), "h-auto justify-start px-4 py-3 text-left")}
          onClick={() => go(id)}
        >
          <div>
            <div className="font-semibold">데모: {PRESETS[id].title}</div>
            <div className="text-xs font-normal text-muted-foreground">{PRESETS[id].subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
