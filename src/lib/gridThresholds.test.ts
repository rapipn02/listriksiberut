import { describe, it, expect } from "vitest";
import { evaluasiAmbang, susunPesanOtomatis, type TitikBeban } from "./gridThresholds";

const t = (
  offsetJam: number,
  bebanKw: number,
  deficitFlag = false,
): TitikBeban => ({
  jam: `${String(8 + offsetJam).padStart(2, "0")}:00`,
  offsetJam,
  bebanKw,
  pltsKw: 20,
  deficitFlag,
});

describe("evaluasiAmbang", () => {
  const PLTD = 50;

  it("tidak memicu saat beban di bawah ambang", () => {
    const h = evaluasiAmbang([t(0, 30), t(1, 35), t(2, 40)], PLTD);
    expect(h.perluKirim).toBe(false);
    expect(h.rasioTertinggi).toBeCloseTo(0.8);
  });

  it("memicu tepat di 90% kapasitas", () => {
    const h = evaluasiAmbang([t(0, 45)], PLTD); // 45/50 = 0.9
    expect(h.perluKirim).toBe(true);
    expect(h.alasan).toContain("90%");
  });

  it("tidak memicu di 89%", () => {
    const h = evaluasiAmbang([t(0, 44.5)], PLTD); // 0.89
    expect(h.perluKirim).toBe(false);
  });

  it("memicu karena deficit_flag walau beban rendah", () => {
    const h = evaluasiAmbang([t(1, 20, true)], PLTD);
    expect(h.perluKirim).toBe(true);
    expect(h.alasan).toContain("Defisit");
  });

  it("memilih pemicu paling awal, bukan yang terburuk", () => {
    const h = evaluasiAmbang([t(3, 49), t(1, 46), t(2, 48)], PLTD);
    expect(h.pemicu?.offsetJam).toBe(1);
  });

  it("mengabaikan titik di luar horizon 3 jam", () => {
    const h = evaluasiAmbang([t(0, 20), t(8, 49)], PLTD);
    expect(h.perluKirim).toBe(false);
  });

  it("menolak kapasitas nol tanpa membagi nol", () => {
    const h = evaluasiAmbang([t(0, 40)], 0);
    expect(h.perluKirim).toBe(false);
    expect(h.alasan).toContain("tidak valid");
  });

  it("menangani data kosong", () => {
    const h = evaluasiAmbang([], PLTD);
    expect(h.perluKirim).toBe(false);
    expect(h.rasioTertinggi).toBe(0);
  });
});

describe("susunPesanOtomatis", () => {
  it("menyebut jam pemicu di dalam pesan", () => {
    const h = evaluasiAmbang([t(1, 48)], 50);
    const p = susunPesanOtomatis(h);
    expect(p.title).toBeTruthy();
    expect(p.message).toContain("09:00");
    expect(p.message).toContain("poin");
  });
});
