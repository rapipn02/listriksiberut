import { describe, it, expect } from "vitest";
import { STATUS_GRID, tampilanStatus } from "./gridStatus";
import type { GridStatus } from "./types";

const SEMUA: GridStatus[] = ["NORMAL", "WARNING", "ALERT"];

describe("STATUS_GRID", () => {
  it("melengkapi ketiga status dengan label, pesan, kondisi, dan warna", () => {
    for (const k of SEMUA) {
      const t = STATUS_GRID[k];
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.pesan.length).toBeGreaterThan(0);
      expect(t.kondisi.length).toBeGreaterThan(0);
      expect(t.grad).toMatch(/^from-/);
      expect(t.pill).toContain("bg-");
      expect(t.titik).toMatch(/^bg-/);
    }
  });

  it("menyebut ambang 20% pada WARNING dan ALERT", () => {
    expect(STATUS_GRID.WARNING.pesan).toContain("20%");
    expect(STATUS_GRID.ALERT.pesan).toContain("20%");
    expect(STATUS_GRID.NORMAL.pesan).not.toContain("20%");
  });

  it("memakai warna berbeda untuk tiap status", () => {
    const warna = SEMUA.map((k) => STATUS_GRID[k].titik);
    expect(new Set(warna).size).toBe(3);
  });
});

describe("tampilanStatus", () => {
  it("jatuh ke NORMAL bila status belum ada", () => {
    expect(tampilanStatus(undefined).label).toBe("NORMAL");
  });

  it("memberi teks gelap untuk kartu kuning", () => {
    expect(STATUS_GRID.WARNING.teks).toBe("text-slate-900");
    expect(STATUS_GRID.NORMAL.teks).toBe("text-white");
    expect(STATUS_GRID.ALERT.teks).toBe("text-white");
  });
});
