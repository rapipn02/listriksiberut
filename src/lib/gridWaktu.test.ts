import { describe, it, expect } from "vitest";
import { targetBerikut, type TitikGrid } from "./gridWaktu";

const JAM = 3600_000;
const T0 = new Date("2026-08-19T12:00:00Z").getTime();

const titik = (mulai: number, pola: boolean[]): TitikGrid[] =>
  pola.map((surplus, i) => ({
    waktuMs: mulai + i * JAM,
    jam: `${String(i).padStart(2, "0")}:00`,
    surplus,
  }));

describe("targetBerikut", () => {
  it("tanpa surplus, menghitung menuju surplus pertama", () => {
    const t = targetBerikut(titik(T0 - JAM, [false, false, true, true]), T0);
    expect(t.sedangSurplus).toBe(false);
    expect(t.arah).toBe("menuju_surplus");
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("saat surplus, menghitung sampai surplus berakhir", () => {
    const t = targetBerikut(titik(T0 - JAM, [true, true, false, false]), T0);
    expect(t.sedangSurplus).toBe(true);
    expect(t.arah).toBe("menuju_habis");
    expect(t.targetMs).toBe(T0 + JAM);
    expect(t.jam).toBe("02:00");
  });

  it("surplus sepanjang prakiraan tidak punya target", () => {
    const t = targetBerikut(titik(T0 - JAM, [true, true, true]), T0);
    expect(t.sedangSurplus).toBe(true);
    expect(t.targetMs).toBeNull();
    expect(t.jam).toBeNull();
  });

  it("tanpa surplus sepanjang prakiraan tidak punya target", () => {
    const t = targetBerikut(titik(T0 - JAM, [false, false, false]), T0);
    expect(t.sedangSurplus).toBe(false);
    expect(t.targetMs).toBeNull();
  });

  it("prakiraan kosong dianggap tanpa surplus", () => {
    const t = targetBerikut([], T0);
    expect(t.sedangSurplus).toBe(false);
    expect(t.targetMs).toBeNull();
  });

  it("memakai titik terakhir yang sudah lewat sebagai kondisi sekarang", () => {
    const t = targetBerikut(
      titik(T0 - 3 * JAM, [false, true, true, true, false]),
      T0,
    );
    expect(t.sedangSurplus).toBe(true);
    expect(t.arah).toBe("menuju_habis");
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("titik tepat di detik ini dihitung sebagai kondisi sekarang", () => {
    const t = targetBerikut(titik(T0, [true, false]), T0);
    expect(t.sedangSurplus).toBe(true);
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("urutan acak tetap menghasilkan target yang sama", () => {
    const asli = titik(T0 - JAM, [false, false, true, true]);
    const acak = [asli[3], asli[0], asli[2], asli[1]];
    expect(targetBerikut(acak, T0).targetMs).toBe(T0 + JAM);
  });

  it("semua titik masih di masa depan: pakai titik paling awal", () => {
    const t = targetBerikut(titik(T0 + JAM, [true, false]), T0);
    expect(t.sedangSurplus).toBe(true);
    expect(t.targetMs).toBe(T0 + 2 * JAM);
  });
});
