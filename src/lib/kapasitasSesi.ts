export interface TitikPlts {
  jam: string;
  plts: number;
}

/**
 * Rata-rata prediksi PLTS pada rentang [mulai, selesai). Menangani sesi yang
 * melewati tengah malam (selesai < mulai). Kembalikan null bila rentang
 * kosong/tidak valid atau tidak ada titik prakiraan yang cocok.
 */
export function rataRataPltsRentang(
  titik: TitikPlts[],
  mulai: string,
  selesai: string,
): number | null {
  if (!mulai || !selesai || mulai === selesai || titik.length === 0) return null;

  const semalam = selesai < mulai;
  const dipilih = titik.filter((t) =>
    semalam ? t.jam >= mulai || t.jam < selesai : t.jam >= mulai && t.jam < selesai,
  );
  if (dipilih.length === 0) return null;

  const total = dipilih.reduce((t, p) => t + p.plts, 0);
  return Math.round((total / dipilih.length) * 10) / 10;
}
