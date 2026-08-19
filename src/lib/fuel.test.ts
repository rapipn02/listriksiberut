import { describe, it, expect } from "vitest";
import { hitungHemat } from "./fuel";

describe("hitungHemat", () => {
  it("50% kepatuhan cocok dengan nilai mockup", () => {
    const h = hitungHemat(50);
    expect(h.liter).toBe(325);
    expect(h.biaya).toBe(3_250_000);
    expect(h.co2).toBe(871);
    expect(h.pohon).toBe(41);
    expect(h.literTahun).toBe(118_625);
  });

  it("skala linear terhadap kepatuhan", () => {
    expect(hitungHemat(80).liter).toBe(520);
    expect(hitungHemat(20).liter).toBe(130);
    expect(hitungHemat(0).liter).toBe(0);
  });

  it("clamp di luar 0..100", () => {
    expect(hitungHemat(-10).liter).toBe(0);
    expect(hitungHemat(150).liter).toBe(650);
  });
});
