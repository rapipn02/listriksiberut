// Siklus hidup sesi Jam Emas: UPCOMING → ACTIVE → ENDED.
//
// Penting bagi mobile: tombol "kirim bukti" di HP warga hanya menyala ketika
// ada sesi berstatus ACTIVE. Kalau route ini tidak jalan, warga tidak akan
// pernah bisa mengirim bukti.
//
// Sekaligus menyegarkan angka yang ditampilkan aplikasi:
//   - currentLoadKw    dari prakiraan ML jam berjalan
//   - participantCount dari partisipasi yang sudah disetujui
//
// Dipanggil cron tiap 5 menit.
import { Timestamp } from "firebase-admin/firestore";
import { getAdmin } from "@/lib/firebaseAdmin";
import { cronDiizinkan, tolakCron } from "@/lib/cronAuth";

export async function POST(request: Request) {
  const dariDashboard = request.headers.get("x-from-dashboard") === "1";
  if (!dariDashboard && !cronDiizinkan(request)) return tolakCron();

  const admin = getAdmin();
  if (!admin) {
    return Response.json(
      { ok: false, error: "Kredensial admin belum dikonfigurasi." },
      { status: 503 },
    );
  }
  const { db } = admin;
  const sekarang = Date.now();

  try {
    // Beban jam berjalan dari prakiraan ML (dipakai semua sesi aktif).
    const fcSnap = await db
      .collection("power_forecasts")
      .where("timestamp", ">=", Timestamp.fromMillis(sekarang - 3600_000))
      .orderBy("timestamp", "asc")
      .limit(1)
      .get();
    const bebanSekarang = fcSnap.empty
      ? 0
      : Math.round((fcSnap.docs[0].data().projected_load_kw ?? 0) * 10) / 10;

    // Jumlah partisipasi disetujui per sesi.
    const partisipasiSnap = await db
      .collection("participation_requests")
      .where("status", "==", "APPROVED")
      .get();
    const hitungPeserta = new Map<string, number>();
    for (const d of partisipasiSnap.docs) {
      const wid = d.data().windowId;
      if (wid) hitungPeserta.set(wid, (hitungPeserta.get(wid) ?? 0) + 1);
    }

    const sesiSnap = await db.collection("load_shift_sessions").get();
    let jadiAktif = 0;
    let jadiSelesai = 0;
    let diperbarui = 0;

    for (const d of sesiSnap.docs) {
      const v = d.data();
      const mulai = v.startAt?.toMillis?.();
      const selesai = v.endAt?.toMillis?.();
      if (!mulai || !selesai) continue; // sesi tanpa waktu — lewati

      const statusSeharusnya =
        sekarang >= selesai ? "ENDED" : sekarang >= mulai ? "ACTIVE" : "UPCOMING";

      const peserta = hitungPeserta.get(d.id) ?? 0;
      const perubahan: Record<string, unknown> = {};

      if (v.status !== statusSeharusnya) {
        perubahan.status = statusSeharusnya;
        if (statusSeharusnya === "ACTIVE") jadiAktif++;
        if (statusSeharusnya === "ENDED") jadiSelesai++;
      }
      if (v.participantCount !== peserta) perubahan.participantCount = peserta;
      // Beban hanya relevan selagi sesi berjalan.
      if (statusSeharusnya === "ACTIVE" && v.currentLoadKw !== bebanSekarang) {
        perubahan.currentLoadKw = bebanSekarang;
      }

      if (Object.keys(perubahan).length > 0) {
        await d.ref.update(perubahan);
        diperbarui++;
      }
    }

    return Response.json({
      ok: true,
      total_sesi: sesiSnap.size,
      diperbarui,
      jadi_aktif: jadiAktif,
      jadi_selesai: jadiSelesai,
      beban_sekarang_kw: bebanSekarang,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Gagal";
    console.error("sessions/tick gagal:", detail);
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
