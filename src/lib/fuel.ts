export const FUEL = {
  hargaSolarPerLiter: 15_000,
  co2PerLiter: 2.68,
  co2SerapPohonPerHari: 21,
  literPenuhPerHari: 650,
};

export interface HasilHemat {
  liter: number;
  literBulan: number;
  literTahun: number;
  biaya: number;
  biayaBulan: number;
  co2: number;
  pohon: number;
}

export function hitungHemat(kepatuhanPersen: number): HasilHemat {
  const p = Math.max(0, Math.min(100, kepatuhanPersen));
  const liter = Math.round(FUEL.literPenuhPerHari * (p / 100));
  const biaya = liter * FUEL.hargaSolarPerLiter;
  const co2 = Math.round(liter * FUEL.co2PerLiter);
  const pohon = Math.round(co2 / FUEL.co2SerapPohonPerHari);
  return {
    liter,
    literBulan: liter * 30,
    literTahun: liter * 365,
    biaya,
    biayaBulan: biaya * 30,
    co2,
    pohon,
  };
}
