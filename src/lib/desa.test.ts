import { describe, it, expect } from "vitest";
import {
  TOTAL_KK_ASUMSI,
  persenPartisipasi,
  ringkasPartisipasi,
  totalKk,
} from "./desa";
import type { SystemStatus } from "./types";

describe("totalKk", () => {
  it("memakai konstanta bila ML belum mengirim jumlah rumah tangga", () => {
    expect(totalKk(undefined)).toBe(TOTAL_KK_ASUMSI);
    expect(totalKk({} as SystemStatus)).toBe(327);
    expect(totalKk({ total_households: 0 } as SystemStatus)).toBe(327);
  });

  it("mendahulukan angka dari ML bila ada", () => {
    expect(totalKk({ total_households: 412 } as SystemStatus)).toBe(412);
  });
});

describe("persenPartisipasi", () => {
  it("membulatkan ke satu desimal", () => {
    expect(persenPartisipasi(12, 327)).toBe(3.7);
    expect(persenPartisipasi(1, 327)).toBe(0.3);
    expect(persenPartisipasi(327, 327)).toBe(100);
  });

  it("nol peserta menghasilkan nol persen", () => {
    expect(persenPartisipasi(0, 327)).toBe(0);
  });

  it("tidak menghasilkan NaN atau Infinity saat penyebut nol", () => {
    expect(persenPartisipasi(5, 0)).toBe(0);
    expect(persenPartisipasi(Number.NaN, 327)).toBe(0);
  });
});

describe("ringkasPartisipasi", () => {
  it("memakai koma sebagai pemisah desimal", () => {
    expect(ringkasPartisipasi(12, 327)).toBe("12 dari 327 KK ikut (3,7%)");
  });
});
