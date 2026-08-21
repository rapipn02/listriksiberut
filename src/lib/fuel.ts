export const FUEL = {
  hargaSolarPerLiter: 10_000,
  co2PerLiter: 2.68,
  co2SerapPohonPerTahun: 21,
  defisitRataRataKw: 25,
  jamPotensiPergeseranPerHari: 10,
  literPerKwhGenset: 0.3,
};

export function literPenuhPerHari(): number {
  return (
    FUEL.defisitRataRataKw *
    FUEL.jamPotensiPergeseranPerHari *
    FUEL.literPerKwhGenset
  );
}

export interface HasilHemat {
  liter: number;
  literBulan: number;
  literTahun: number;
  biaya: number;
  biayaBulan: number;
  co2: number;
  co2Tahun: number;
  pohonTahun: number;
}

export function hitungHemat(kepatuhanPersen: number): HasilHemat {
  const p = Math.max(0, Math.min(100, kepatuhanPersen));
  const liter = Math.round(literPenuhPerHari() * (p / 100));
  const biaya = liter * FUEL.hargaSolarPerLiter;
  const co2 = Math.round(liter * FUEL.co2PerLiter);
  const literTahun = liter * 365;
  const co2Tahun = Math.round(literTahun * FUEL.co2PerLiter);
  const pohonTahun = Math.round(co2Tahun / FUEL.co2SerapPohonPerTahun);
  return {
    liter,
    literBulan: liter * 30,
    literTahun,
    biaya,
    biayaBulan: biaya * 30,
    co2,
    co2Tahun,
    pohonTahun,
  };
}
