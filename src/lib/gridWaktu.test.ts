import { describe, it, expect } from "vitest";
import { targetBerikut, type TitikGrid } from "./gridWaktu";

const JAM = 3600_000;
const T0 = new Date("2026-08-19T12:00:00Z").getTime();

const titik = (mulai: number, pola: boolean[]): TitikGrid[] =>
  pola.map((defisit, i) => ({
    waktuMs: mulai + i * JAM,
    jam: `${String(i).padStart(2, "0")}:00`,
    defisit,
  }));

describe("targetBerikut", () => {
  it("saat aman, menghitung menuju defisit pertama", () => {
    const t = targetBerikut(titik(T0 - JAM, [false, false, true, true]), T0);
    expect(t.sedangDefisit).toBe(false);
    expect(t.arah).toBe("menuju_defisit");
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("saat defisit, menghitung menuju titik aman pertama", () => {
    const t = targetBerikut(titik(T0 - JAM, [true, true, false, false]), T0);
    expect(t.sedangDefisit).toBe(true);
    expect(t.arah).toBe("menuju_aman");
    expect(t.targetMs).toBe(T0 + JAM);
    expect(t.jam).toBe("02:00");
  });

  it("defisit sepanjang prakiraan tidak punya target", () => {
    const t = targetBerikut(titik(T0 - JAM, [true, true, true]), T0);
    expect(t.sedangDefisit).toBe(true);
    expect(t.targetMs).toBeNull();
    expect(t.jam).toBeNull();
  });

  it("aman sepanjang prakiraan tidak punya target", () => {
    const t = targetBerikut(titik(T0 - JAM, [false, false, false]), T0);
    expect(t.sedangDefisit).toBe(false);
    expect(t.targetMs).toBeNull();
  });

  it("prakiraan kosong dianggap aman tanpa target", () => {
    const t = targetBerikut([], T0);
    expect(t.sedangDefisit).toBe(false);
    expect(t.targetMs).toBeNull();
  });

  it("memakai titik terakhir yang sudah lewat sebagai kondisi sekarang", () => {
    const t = targetBerikut(
      titik(T0 - 3 * JAM, [false, true, true, true, false]),
      T0,
    );
    expect(t.sedangDefisit).toBe(true);
    expect(t.arah).toBe("menuju_aman");
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("titik tepat di detik ini dihitung sebagai kondisi sekarang", () => {
    const t = targetBerikut(titik(T0, [true, false]), T0);
    expect(t.sedangDefisit).toBe(true);
    expect(t.targetMs).toBe(T0 + JAM);
  });

  it("urutan acak tetap menghasilkan target yang sama", () => {
    const asli = titik(T0 - JAM, [false, false, true, true]);
    const acak = [asli[3], asli[0], asli[2], asli[1]];
    expect(targetBerikut(acak, T0).targetMs).toBe(T0 + JAM);
  });

  it("semua titik masih di masa depan: pakai titik paling awal", () => {
    const t = targetBerikut(titik(T0 + JAM, [true, false]), T0);
    expect(t.sedangDefisit).toBe(true);
    expect(t.targetMs).toBe(T0 + 2 * JAM);
  });
});
