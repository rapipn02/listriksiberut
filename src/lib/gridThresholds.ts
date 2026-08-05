// Penentu kapan sistem harus mengirim imbauan otomatis.
// Fungsi murni tanpa Firestore/tanggal sistem supaya mudah diuji.

/** Ambang beban terhadap kapasitas PLTD yang memicu peringatan. */
export const AMBANG_BEBAN = 0.9;

/** Berapa jam ke depan yang dipantau untuk memicu peringatan dini. */
export const HORIZON_JAM = 3;

export interface TitikBeban {
  /** ISO string atau label jam — hanya untuk pesan, tidak dipakai berhitung. */
  jam: string;
  /** Jam ke berapa dari sekarang (0 = jam berjalan). */
  offsetJam: number;
  bebanKw: number;
  pltsKw: number;
  deficitFlag: boolean;
}

export interface HasilAmbang {
  perluKirim: boolean;
  alasan: string;
  /** Titik yang memicu; null bila tidak ada. */
  pemicu: TitikBeban | null;
  /** Rasio beban tertinggi terhadap kapasitas PLTD dalam horizon. */
  rasioTertinggi: number;
}

/**
 * Tentukan apakah perlu mengirim imbauan otomatis.
 *
 * Memicu bila dalam HORIZON_JAM ke depan ada titik yang:
 *   - rasio beban terhadap kapasitas PLTD >= AMBANG_BEBAN, ATAU
 *   - ditandai defisit oleh pipeline ML
 */
export function evaluasiAmbang(
  titik: TitikBeban[],
  kapasitasPltdKw: number,
): HasilAmbang {
  const kosong: HasilAmbang = {
    perluKirim: false,
    alasan: "",
    pemicu: null,
    rasioTertinggi: 0,
  };

  if (titik.length === 0) {
    return { ...kosong, alasan: "Tidak ada data prakiraan." };
  }
  if (kapasitasPltdKw <= 0) {
    return { ...kosong, alasan: "Kapasitas PLTD tidak valid." };
  }

  const dalamHorizon = titik.filter(
    (t) => t.offsetJam >= 0 && t.offsetJam <= HORIZON_JAM,
  );
  if (dalamHorizon.length === 0) {
    return { ...kosong, alasan: `Tidak ada data ${HORIZON_JAM} jam ke depan.` };
  }

  const rasioTertinggi = Math.max(
    ...dalamHorizon.map((t) => t.bebanKw / kapasitasPltdKw),
  );

  // Prioritaskan titik paling awal yang memicu — imbauan harus dikirim
  // sebelum kejadian, bukan pada titik terburuk yang mungkin masih jauh.
  const pemicu =
    dalamHorizon
      .slice()
      .sort((a, b) => a.offsetJam - b.offsetJam)
      .find(
        (t) => t.deficitFlag || t.bebanKw / kapasitasPltdKw >= AMBANG_BEBAN,
      ) ?? null;

  if (!pemicu) {
    return {
      perluKirim: false,
      alasan: `Beban aman (tertinggi ${Math.round(rasioTertinggi * 100)}% kapasitas).`,
      pemicu: null,
      rasioTertinggi,
    };
  }

  const persen = Math.round((pemicu.bebanKw / kapasitasPltdKw) * 100);
  return {
    perluKirim: true,
    alasan: pemicu.deficitFlag
      ? `Defisit diprediksi pukul ${pemicu.jam} (beban ${persen}% kapasitas).`
      : `Beban mencapai ${persen}% kapasitas pukul ${pemicu.jam}.`,
    pemicu,
    rasioTertinggi,
  };
}

/** Susun pesan imbauan yang dikirim ke warga. */
export function susunPesanOtomatis(hasil: HasilAmbang): {
  title: string;
  message: string;
} {
  const jam = hasil.pemicu?.jam ?? "malam ini";
  return {
    title: "Peringatan Beban Listrik Tinggi",
    message:
      `Pemakaian listrik desa diprediksi memuncak pukul ${jam}. ` +
      "Mohon tunda pemakaian alat berdaya besar (AC, pompa air, mesin pendingin) " +
      "sampai beban turun. Ikut menggeser jam pemakaian = dapat poin BUMDes.",
  };
}
