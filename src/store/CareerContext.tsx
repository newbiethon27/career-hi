"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { buildPresetAssessment, PRESETS, type PresetId } from "@/lib/presets";
import { storage } from "@/lib/storage";
import type { AssessmentResult, UserProfile } from "@/lib/types";

// ---------- 외부 스토어 (localStorage 를 source of truth 로, 메모리 스냅샷을 캐시로) ----------

interface Snapshot {
  assessment: AssessmentResult | null;
  profile: UserProfile | null;
  hydrated: boolean; // 클라이언트에서 localStorage 를 읽었는지 — 가드 리다이렉트 오작동 방지
}

const SERVER_SNAPSHOT: Snapshot = { assessment: null, profile: null, hydrated: false };

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Snapshot {
  if (snapshot === null) {
    snapshot = { assessment: storage.loadAssessment(), profile: storage.loadProfile(), hydrated: true };
  }
  return snapshot;
}

function emit(next: Partial<Snapshot>) {
  snapshot = { ...getSnapshot(), ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------- Context ----------

interface CareerState extends Snapshot {
  setAssessment: (r: AssessmentResult) => void;
  setProfile: (p: UserProfile) => void;
  loadPreset: (id: PresetId) => void;
  reset: () => void;
}

const actions = {
  setAssessment(r: AssessmentResult) {
    storage.saveAssessment(r);
    storage.clearProgress();
    emit({ assessment: r });
  },
  setProfile(p: UserProfile) {
    storage.saveProfile(p);
    emit({ profile: p });
  },
  loadPreset(id: PresetId) {
    const a = buildPresetAssessment(id);
    const p = PRESETS[id].profile;
    storage.saveAssessment(a);
    storage.saveProfile(p);
    storage.clearProgress();
    emit({ assessment: a, profile: p });
  },
  reset() {
    storage.clearAll();
    emit({ assessment: null, profile: null });
  },
};

const CareerContext = createContext<CareerState | null>(null);

export function CareerProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const value = useMemo<CareerState>(() => ({ ...snap, ...actions }), [snap]);
  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
}

export function useCareer(): CareerState {
  const ctx = useContext(CareerContext);
  if (!ctx) throw new Error("useCareer must be used within CareerProvider");
  return ctx;
}
