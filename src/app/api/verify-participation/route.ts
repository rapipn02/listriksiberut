import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAdmin } from "@/lib/firebaseAdmin";
import { cronDiizinkan, tolakCron } from "@/lib/cronAuth";
import {
  verifikasiBanyak,
  type JendelaImbauan,
  type KlaimTersetujui,
  type PengajuanPartisipasi,
} from "@/lib/verification";

const MAKS_PER_JALAN = 50;

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
    const menungguSnap = await db
      .collection("participation_requests")
      .where("status", "==", "PENDING")
      .limit(MAKS_PER_JALAN)
      .get();

    if (menungguSnap.empty) {
      return Response.json({
        ok: true,
        diproses: 0,
        disetujui: 0,
        ditolak: 0,
        alasan: "Tidak ada pengajuan menunggu.",
      });
    }

    const sesiSnap = await db
      .collection("load_shift_sessions")
      .where("endAt", ">", Timestamp.fromMillis(sekarang - 24 * 3600_000))
      .get();
    const jendela: JendelaImbauan[] = sesiSnap.docs
      .filter((d) => d.data().startAt && d.data().endAt)
      .map((d) => {
        const v = d.data();
        return {
          id: d.id,
          mulaiMs: v.startAt.toMillis(),
          selesaiMs: v.endAt.toMillis(),
          poinPerPartisipasi: v.poin_per_partisipasi ?? 25,
        };
      });

    const disetujuiSnap = await db
      .collection("participation_requests")
      .where("status", "==", "APPROVED")
      .get();
    const klaim: KlaimTersetujui[] = disetujuiSnap.docs
      .map((d) => ({ userId: d.data().userId, windowId: d.data().windowId }))
      .filter((k): k is KlaimTersetujui => Boolean(k.userId && k.windowId));

    const pengajuan: PengajuanPartisipasi[] = menungguSnap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        userId: v.userId,
        jumlahFoto: Array.isArray(v.photosBase64) ? v.photosBase64.length : 0,
        submittedAtMs: v.timestamp?.toMillis?.() ?? 0,
      };
    });

    const hasil = verifikasiBanyak(pengajuan, jendela, klaim, sekarang);

    let disetujui = 0;
    let ditolak = 0;

    for (const { pengajuan: p, hasil: h } of hasil) {
      const reqRef = db.collection("participation_requests").doc(p.id);

      if (h.status === "APPROVED") {
        await db.runTransaction(async (tx) => {
          const kini = await tx.get(reqRef);
          if (!kini.exists || kini.data()?.status !== "PENDING") return;

          tx.update(reqRef, {
            status: "APPROVED",
            poinDiberikan: h.poin,
            windowId: h.windowId,
            verifiedAt: Timestamp.fromMillis(sekarang),
            verificationReason: h.reason,
          });
          tx.set(
            db.collection("BUMDes_rewards").doc(p.userId),
            { total_poin: FieldValue.increment(h.poin) },
            { merge: true },
          );
        });
        disetujui++;
      } else {
        await reqRef.update({
          status: "REJECTED",
          poinDiberikan: 0,
          windowId: h.windowId,
          verifiedAt: Timestamp.fromMillis(sekarang),
          verificationReason: h.reason,
        });
        ditolak++;
      }
    }

    return Response.json({
      ok: true,
      diproses: hasil.length,
      disetujui,
      ditolak,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Gagal";
    console.error("verify-participation gagal:", detail);
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
