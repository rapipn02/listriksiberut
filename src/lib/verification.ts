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
  hashFoto?: string[];
}

export interface KlaimTersetujui {
  userId: string;
  windowId: string;
}

export type KodeAlasan =
  | "OK_APPROVED"
  | "ERR_FUTURE_TIMESTAMP"
  | "ERR_NO_PHOTO"
  | "ERR_OUTSIDE_WINDOW"
  | "ERR_DUPLICATE"
  | "ERR_DUPLICATE_PHOTO";

export interface HasilVerifikasi {
  status: Exclude<ParticipationStatus, "PENDING">;
  poin: number;
  windowId: string | null;
  reason: string;
  reasonCode: KodeAlasan;
}

const TOLERANSI_MASA_DEPAN_MS = 5 * 60_000;

export function verifikasi(
  pengajuan: PengajuanPartisipasi,
  jendela: JendelaImbauan[],
  klaimTersetujui: KlaimTersetujui[],
  sekarangMs: number,
  hashTerpakai: string[] = [],
): HasilVerifikasi {
  if (pengajuan.submittedAtMs > sekarangMs + TOLERANSI_MASA_DEPAN_MS) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Waktu pengiriman berada di masa depan.",
      reasonCode: "ERR_FUTURE_TIMESTAMP",
    };
  }

  if (pengajuan.jumlahFoto < 1) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: null,
      reason: "Foto bukti tidak ditemukan.",
      reasonCode: "ERR_NO_PHOTO",
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
      reasonCode: "ERR_OUTSIDE_WINDOW",
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
      reasonCode: "ERR_DUPLICATE",
    };
  }

  const kembar = (pengajuan.hashFoto ?? []).find((h) => hashTerpakai.includes(h));
  if (kembar) {
    return {
      status: "REJECTED",
      poin: 0,
      windowId: cocok.id,
      reason: "Foto identik sudah pernah dipakai pengajuan lain.",
      reasonCode: "ERR_DUPLICATE_PHOTO",
    };
  }

  return {
    status: "APPROVED",
    poin: cocok.poinPerPartisipasi,
    windowId: cocok.id,
    reason: "Terverifikasi: dikirim dalam jendela imbauan aktif.",
    reasonCode: "OK_APPROVED",
  };
}

export function verifikasiBanyak(
  pengajuan: PengajuanPartisipasi[],
  jendela: JendelaImbauan[],
  klaimTersetujui: KlaimTersetujui[],
  sekarangMs: number,
  hashTerpakai: string[] = [],
): Array<{ pengajuan: PengajuanPartisipasi; hasil: HasilVerifikasi }> {
  const klaim = [...klaimTersetujui];
  const hash = [...hashTerpakai];
  const keluaran: Array<{
    pengajuan: PengajuanPartisipasi;
    hasil: HasilVerifikasi;
  }> = [];

  const urut = [...pengajuan].sort((a, b) => a.submittedAtMs - b.submittedAtMs);

  for (const p of urut) {
    const hasil = verifikasi(p, jendela, klaim, sekarangMs, hash);
    if (hasil.status === "APPROVED" && hasil.windowId) {
      klaim.push({ userId: p.userId, windowId: hasil.windowId });
      hash.push(...(p.hashFoto ?? []));
    }
    keluaran.push({ pengajuan: p, hasil });
  }

  return keluaran;
}
