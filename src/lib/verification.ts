// Mesin verifikasi partisipasi warga.
//
// CATATAN PENTING: sistem tidak punya telemetri meteran, sehingga tidak mungkin
// mencocokkan foto dengan penurunan beban sungguhan di grid (data beban dari
// pipeline ML adalah skenario sintetis, bukan pembacaan meteran). Karena itu
// verifikasi memakai aturan deterministik yang tetap berjalan otomatis tanpa
// operator, dengan alasan keputusan selalu dicatat agar bisa diaudit.
//
// Fungsi murni: tidak menyentuh Firestore maupun jam sistem — waktu selalu
// diberikan pemanggil supaya hasilnya bisa diuji.

export type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Bentuk minimal yang dibutuhkan mesin — bebas dari tipe Firestore. */
export interface JendelaImbauan {
  id: string;
  mulaiMs: number;
  selesaiMs: number;
  poinPerPartisipasi: number;
}

export interface PengajuanPartisipasi {
  id: string;
  userId: string;
  /** Jumlah foto bukti yang dilampirkan. */
  jumlahFoto: number;
  submittedAtMs: number;
}

/** Partisipasi yang sudah disetujui sebelumnya, untuk mencegah klaim ganda. */
export interface KlaimTersetujui {
  userId: string;
  windowId: string;
}

export interface HasilVerifikasi {
  status: Exclude<ParticipationStatus, "PENDING">;
  poin: number;
  windowId: string | null;
  reason: string;
}

/** Toleransi jam HP warga yang meleset sedikit dari jam server. */
const TOLERANSI_MASA_DEPAN_MS = 5 * 60_000;

/**
 * Nilai satu pengajuan.
 *
 * Aturan dijalankan berurutan dan berhenti pada kegagalan pertama:
 *   1. waktu kirim jatuh di dalam jendela imbauan
 *   2. warga belum pernah disetujui di jendela yang sama
 *   3. foto ada & waktu kirim tidak di masa depan
 */
export function verifikasi(
  pengajuan: PengajuanPartisipasi,
  jendela: JendelaImbauan[],
  klaimTersetujui: KlaimTersetujui[],
  sekarangMs: number,
): HasilVerifikasi {
  // 3a. Waktu kirim tidak boleh di masa depan (diperiksa lebih dulu karena
  //     waktu yang tidak masuk akal membuat pencocokan jendela tak bermakna).
  if (pengajuan.submittedAtMs > sekarangMs + TOLERANSI_MASA_DEPAN_MS) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Waktu pengiriman berada di masa depan.",
    };
  }

  // 3b. Minimal satu foto bukti wajib ada.
  if (pengajuan.jumlahFoto < 1) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Foto bukti tidak ditemukan.",
    };
  }

  // 1. Cari jendela yang mencakup waktu kirim.
  const cocok = jendela.find(
    (j) =>
      pengajuan.submittedAtMs >= j.mulaiMs &&
      pengajuan.submittedAtMs <= j.selesaiMs,
  );
  if (!cocok) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Dikirim di luar jendela imbauan yang aktif.",
    };
  }

  // 2. Cegah klaim ganda pada jendela yang sama.
  const sudahKlaim = klaimTersetujui.some(
    (k) => k.userId === pengajuan.userId && k.windowId === cocok.id,
  );
  if (sudahKlaim) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: cocok.id,
      reason: "Sudah menerima poin untuk jendela imbauan ini.",
    };
  }

  return {
    status: "APPROVED",
    poin: cocok.poinPerPartisipasi,
    windowId: cocok.id,
    reason: "Terverifikasi: dikirim dalam jendela imbauan aktif.",
  };
}

/**
 * Verifikasi banyak pengajuan sekaligus.
 *
 * Klaim yang baru disetujui langsung dimasukkan ke daftar klaim, sehingga dua
 * pengajuan dari warga yang sama dalam satu proses tidak keduanya diberi poin.
 */
export function verifikasiBanyak(
  pengajuan: PengajuanPartisipasi[],
  jendela: JendelaImbauan[],
  klaimTersetujui: KlaimTersetujui[],
  sekarangMs: number,
): Array<{ pengajuan: PengajuanPartisipasi; hasil: HasilVerifikasi }> {
  const klaim = [...klaimTersetujui];
  const keluaran: Array<{
    pengajuan: PengajuanPartisipasi;
    hasil: HasilVerifikasi;
  }> = [];

  // Urutkan dari yang paling awal supaya pengajuan pertama yang menang
  // bila ada dua kiriman dalam jendela yang sama.
  const urut = [...pengajuan].sort((a, b) => a.submittedAtMs - b.submittedAtMs);

  for (const p of urut) {
    const hasil = verifikasi(p, jendela, klaim, sekarangMs);
    if (hasil.status === "APPROVED" && hasil.windowId) {
      klaim.push({ userId: p.userId, windowId: hasil.windowId });
    }
    keluaran.push({ pengajuan: p, hasil });
  }

  return keluaran;
}
