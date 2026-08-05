export type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JendelaImbauan {
  id: string;
  mulaiMs: number;
  selesaiMs: number;
  poinPerPartisipasi: number;
}

export interface PengajuanPartisipasi {
  id: string;
  userId: string;

  jumlahFoto: number;
  submittedAtMs: number;
}

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

const TOLERANSI_MASA_DEPAN_MS = 5 * 60_000;

export function verifikasi(
  pengajuan: PengajuanPartisipasi,
  jendela: JendelaImbauan[],
  klaimTersetujui: KlaimTersetujui[],
  sekarangMs: number,
): HasilVerifikasi {
  if (pengajuan.submittedAtMs > sekarangMs + TOLERANSI_MASA_DEPAN_MS) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Waktu pengiriman berada di masa depan.",
    };
  }

  if (pengajuan.jumlahFoto < 1) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Foto bukti tidak ditemukan.",
    };
  }

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
