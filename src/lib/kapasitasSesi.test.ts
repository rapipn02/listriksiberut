import { describe, it, expect } from "vitest";
import { rataRataPltsRentang } from "./kapasitasSesi";

const titik = [
  { jam: "08:00", plts: 10 },
  { jam: "09:00", plts: 20 },
  { jam: "10:00", plts: 30 },
  { jam: "11:00", plts: 40 },
  { jam: "12:00", plts: 50 },
  { jam: "22:00", plts: 0 },
  { jam: "23:00", plts: 0 },
];

describe("rataRataPltsRentang", () => {
  it("merata-ratakan titik di dalam rentang", () => {
    expect(rataRataPltsRentang(titik, "09:00", "12:00")).toBe(30);
  });

  it("mengecualikan titik akhir (setengah terbuka)", () => {
    expect(rataRataPltsRentang(titik, "10:00", "11:00")).toBe(30);
  });

  it("menangani rentang yang melewati tengah malam", () => {
    expect(rataRataPltsRentang(titik, "22:00", "09:00")).toBe(3.3); // 08:00(10)+22:00(0)+23:00(0), rata-rata 3,3
  });

  it("null bila mulai sama dengan selesai", () => {
    expect(rataRataPltsRentang(titik, "10:00", "10:00")).toBeNull();
  });

  it("null bila tidak ada titik yang cocok", () => {
    expect(rataRataPltsRentang(titik, "13:00", "14:00")).toBeNull();
  });

  it("null bila daftar titik kosong atau parameter kosong", () => {
    expect(rataRataPltsRentang([], "09:00", "12:00")).toBeNull();
    expect(rataRataPltsRentang(titik, "", "12:00")).toBeNull();
  });

  it("membulatkan satu desimal", () => {
    const t = [
      { jam: "10:00", plts: 31.111 },
      { jam: "11:00", plts: 31.322 },
    ];
    expect(rataRataPltsRentang(t, "10:00", "12:00")).toBe(31.2);
  });
});
