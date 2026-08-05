// Fungsi murni hitung penghematan BBM solar dari load shifting.
// Konstanta domain — konfirmasi angka final ke tim (TODO).
export const FUEL = {
  hargaSolarPerLiter: 15_000, // Rp/L
  co2PerLiter: 2.68, // kg CO2 per liter solar
  co2SerapPohonPerHari: 21, // kg CO2 setara serapan 1 pohon (pendekatan, per basis harian mockup)
  literPenuhPerHari: 650, // liter/hari dihemat saat kepatuhan 100% (50% => 325 L)
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

/** kepatuhanPersen: 0..100 */
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
