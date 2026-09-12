import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ returns: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase", () => ({
  supabase: { from: () => ({ select: () => ({ order: () => ({ returns: db.returns }) }) }) },
}));

import { loadCompanies } from "@/lib/companies.server";

const row = {
  id: "a92b6d59-bebc-41cc-817a-30b66924bade",
  slug: "samsung-sds",
  name: "Samsung SDS",
  industry: "IT",
  corp_code: "00126186",
  job_families: ["dev"],
  worklife_index: 66,
  worklife_note: "manual",
  dart_as_of: "2025",
  avg_salary_manwon: 13829,
  avg_tenure_years: "17.2",
  employee_count: 11219,
  employee_count_prev: 11387,
  revenue: "13929868",
  revenue_prev: "13828232",
  operating_profit: "957103",
  operating_profit_prev: "911097",
  sort_order: 0,
};

beforeEach(() => vi.clearAllMocks());

describe("Supabase company identity", () => {
  it("uses the app slug while preserving the source UUID", async () => {
    db.returns.mockResolvedValue({ data: [row], error: null });
    const result = await loadCompanies();
    expect(result.origin).toBe("supabase");
    expect(result.companies[0].id).toBe("samsung-sds");
    expect(row.id).toBe("a92b6d59-bebc-41cc-817a-30b66924bade");
  });

  it("does not expose unrelated legacy rows without app slugs", async () => {
    db.returns.mockResolvedValue({ data: [{ ...row, slug: null }, row], error: null });
    const result = await loadCompanies();
    expect(result.companies.map((c) => c.id)).toEqual(["samsung-sds"]);
  });

  it("falls back explicitly when the slug migration has not run", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      db.returns.mockResolvedValue({ data: [{ ...row, slug: undefined }], error: null });
      const result = await loadCompanies();
      expect(result.origin).toBe("fallback");
      expect(result.fallbackReason).toContain("slug");
    } finally {
      log.mockRestore();
    }
  });
});
