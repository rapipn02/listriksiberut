import { describe, it, expect } from "vitest";
import { findGreenWindow } from "./greenHours";
import type { ForecastPoint } from "./demoData";

const p = (jam: string, plts: number, beban: number): ForecastPoint => ({
  jam,
  plts,
  beban,
  deficit: beban > plts,
});

describe("findGreenWindow", () => {
  it("menemukan rentang surplus", () => {
    const w = findGreenWindow([
      p("08:00", 10, 30),
      p("09:00", 25, 30),
      p("10:00", 45, 30),
      p("11:00", 55, 32),
      p("12:00", 50, 33),
      p("13:00", 20, 35),
    ]);
    expect(w).not.toBeNull();
    expect(w!.mulai).toBe("10:00");
    expect(w!.selesai).toBe("13:00");
    expect(w!.jam).toBe(3);
    expect(w!.surplusKw).toBe(23);
  });

  it("null saat tidak ada surplus", () => {
    const w = findGreenWindow([p("18:00", 0, 40), p("19:00", 0, 55)]);
    expect(w).toBeNull();
  });

  it("null saat data kosong", () => {
    expect(findGreenWindow([])).toBeNull();
  });

  it("menangani surplus di ujung akhir array", () => {
    const w = findGreenWindow([p("05:00", 0, 30), p("06:00", 40, 30)]);
    expect(w!.mulai).toBe("06:00");
    expect(w!.selesai).toBe("07:00");
    expect(w!.jam).toBe(1);
  });

  it("memilih rentang terpanjang, bukan yang pertama", () => {
    const w = findGreenWindow([
      p("07:00", 40, 30),
      p("08:00", 10, 30),
      p("09:00", 40, 30),
      p("10:00", 45, 30),
      p("11:00", 42, 30),
    ]);
    expect(w!.mulai).toBe("09:00");
    expect(w!.jam).toBe(3);
  });

  it("membungkus tengah malam untuk jam selesai", () => {
    const w = findGreenWindow([p("23:00", 40, 30)]);
    expect(w!.selesai).toBe("00:00");
  });
});
