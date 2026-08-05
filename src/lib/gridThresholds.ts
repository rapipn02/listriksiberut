export const AMBANG_BEBAN = 0.9;

export const HORIZON_JAM = 3;

export interface TitikBeban {
  jam: string;

  offsetJam: number;
  bebanKw: number;
  pltsKw: number;
  deficitFlag: boolean;
}

export interface HasilAmbang {
  perluKirim: boolean;
  alasan: string;

  pemicu: TitikBeban | null;

  rasioTertinggi: number;
}

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
