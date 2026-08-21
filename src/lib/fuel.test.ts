import { describe, it, expect } from "vitest";
import { FUEL, hitungHemat, literPenuhPerHari } from "./fuel";

describe("literPenuhPerHari", () => {
  it("dihitung dari defisit rata-rata x jam potensi x konsumsi genset", () => {
    expect(literPenuhPerHari()).toBe(
      FUEL.defisitRataRataKw *
        FUEL.jamPotensiPergeseranPerHari *
        FUEL.literPerKwhGenset,
    );
    expect(literPenuhPerHari()).toBe(75);
  });
});

describe("hitungHemat", () => {
  it("50% kepatuhan menghasilkan angka yang berdasar fisika genset", () => {
    const h = hitungHemat(50);
    expect(h.liter).toBe(38);
    expect(h.biaya).toBe(380_000);
    expect(h.co2).toBe(102);
    expect(h.literTahun).toBe(13_870);
  });

  it("pohon dihitung dari serapan TAHUNAN, bukan harian", () => {
    const h = hitungHemat(50);
    expect(h.co2Tahun).toBe(37_172);
    expect(h.pohonTahun).toBe(Math.round(h.co2Tahun / FUEL.co2SerapPohonPerTahun));
    expect(h.pohonTahun).toBe(1_770);
  });

  it("skala linear terhadap kepatuhan", () => {
    expect(hitungHemat(80).liter).toBe(60);
    expect(hitungHemat(20).liter).toBe(15);
    expect(hitungHemat(0).liter).toBe(0);
  });

  it("clamp di luar 0..100", () => {
    expect(hitungHemat(-10).liter).toBe(0);
    expect(hitungHemat(150).liter).toBe(75);
  });
});
