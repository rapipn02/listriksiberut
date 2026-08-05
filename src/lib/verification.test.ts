import { describe, it, expect } from "vitest";
import {
  verifikasi,
  verifikasiBanyak,
  type JendelaImbauan,
  type PengajuanPartisipasi,
} from "./verification";

const JAM = 3600_000;
const SEKARANG = new Date("2026-08-04T12:00:00Z").getTime();

const jendela: JendelaImbauan[] = [
  {
    id: "w1",
    mulaiMs: SEKARANG - 2 * JAM,
    selesaiMs: SEKARANG - 1 * JAM,
    poinPerPartisipasi: 25,
  },
  {
    id: "w2",
    mulaiMs: SEKARANG - 30 * 60_000,
    selesaiMs: SEKARANG + 30 * 60_000,
    poinPerPartisipasi: 40,
  },
];

const ajukan = (
  over: Partial<PengajuanPartisipasi> = {},
): PengajuanPartisipasi => ({
  id: "p1",
  userId: "warga_java",
  jumlahFoto: 2,
  submittedAtMs: SEKARANG - 10 * 60_000,
  ...over,
});

describe("verifikasi", () => {
  it("menyetujui pengajuan di dalam jendela aktif", () => {
    const h = verifikasi(ajukan(), jendela, [], SEKARANG);
    expect(h.status).toBe("APPROVED");
    expect(h.poin).toBe(40);
    expect(h.windowId).toBe("w2");
  });

  it("memberi poin sesuai jendela yang dimasuki", () => {
    const h = verifikasi(
      ajukan({ submittedAtMs: SEKARANG - 90 * 60_000 }),
      jendela,
      [],
      SEKARANG,
    );
    expect(h.status).toBe("APPROVED");
    expect(h.poin).toBe(25);
  });

  it("menolak di luar semua jendela", () => {
    const h = verifikasi(
      ajukan({ submittedAtMs: SEKARANG - 10 * JAM }),
      jendela,
      [],
      SEKARANG,
    );
    expect(h.status).toBe("REJECTED");
    expect(h.reason).toContain("luar jendela");
    expect(h.poin).toBe(0);
  });

  it("menolak klaim ganda pada jendela sama", () => {
    const h = verifikasi(
      ajukan(),
      jendela,
      [{ userId: "warga_java", windowId: "w2" }],
      SEKARANG,
    );
    expect(h.status).toBe("REJECTED");
    expect(h.reason).toContain("Sudah menerima poin");
  });

  it("mengizinkan warga sama di jendela berbeda", () => {
    const h = verifikasi(
      ajukan(),
      jendela,
      [{ userId: "warga_java", windowId: "w1" }],
      SEKARANG,
    );
    expect(h.status).toBe("APPROVED");
  });

  it("menolak waktu di masa depan", () => {
    const h = verifikasi(
      ajukan({ submittedAtMs: SEKARANG + 2 * JAM }),
      jendela,
      [],
      SEKARANG,
    );
    expect(h.status).toBe("REJECTED");
    expect(h.reason).toContain("masa depan");
  });

  it("memaafkan selisih jam HP beberapa menit", () => {
    const h = verifikasi(
      ajukan({ submittedAtMs: SEKARANG + 2 * 60_000 }),
      jendela,
      [],
      SEKARANG,
    );
    expect(h.status).toBe("APPROVED");
  });

  it("menolak tanpa foto", () => {
    const h = verifikasi(ajukan({ jumlahFoto: 0 }), jendela, [], SEKARANG);
    expect(h.status).toBe("REJECTED");
    expect(h.reason).toContain("Foto");
  });

  it("menolak saat tidak ada jendela sama sekali", () => {
    const h = verifikasi(ajukan(), [], [], SEKARANG);
    expect(h.status).toBe("REJECTED");
  });
});

describe("verifikasiBanyak", () => {
  it("hanya menyetujui satu dari dua kiriman warga sama di jendela sama", () => {
    const hasil = verifikasiBanyak(
      [
        ajukan({ id: "a", submittedAtMs: SEKARANG - 20 * 60_000 }),
        ajukan({ id: "b", submittedAtMs: SEKARANG - 5 * 60_000 }),
      ],
      jendela,
      [],
      SEKARANG,
    );
    const disetujui = hasil.filter((h) => h.hasil.status === "APPROVED");
    expect(disetujui).toHaveLength(1);
    expect(disetujui[0].pengajuan.id).toBe("a");
  });

  it("menyetujui warga berbeda di jendela sama", () => {
    const hasil = verifikasiBanyak(
      [
        ajukan({ id: "a", userId: "warga_java" }),
        ajukan({ id: "b", userId: "warga_siti" }),
      ],
      jendela,
      [],
      SEKARANG,
    );
    expect(hasil.every((h) => h.hasil.status === "APPROVED")).toBe(true);
  });

  it("mengembalikan daftar kosong untuk masukan kosong", () => {
    expect(verifikasiBanyak([], jendela, [], SEKARANG)).toEqual([]);
  });
});
