// Penukaran poin jadi kode digital — dipanggil aplikasi mobile warga.
//
// Semua dijalankan dalam SATU transaksi Firestore supaya:
//   - poin tidak bisa dipakai dua kali (permintaan bersamaan)
//   - satu kode voucher tidak diberikan ke dua warga
//   - bila ada langkah gagal, poin tidak berkurang dan kode tidak hangus
//
// Mobile TIDAK boleh menulis total_poin atau digital_vouchers langsung —
// kalau boleh, warga bisa menaikkan poinnya sendiri lewat panggilan Firestore.
import { Timestamp } from "firebase-admin/firestore";
import { getAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) {
    return Response.json(
      { ok: false, error: "Layanan belum dikonfigurasi." },
      { status: 503 },
    );
  }
  const { db, app } = admin;

  // --- Identitas pemanggil: wajib ID token Firebase yang sah ---
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!idToken) {
    return Response.json(
      { ok: false, error: "Token tidak disertakan." },
      { status: 401 },
    );
  }

  let uid: string;
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth(app).verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json(
      { ok: false, error: "Token tidak sah atau kedaluwarsa." },
      { status: 401 },
    );
  }

  let body: { catalog_id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Body tidak valid." },
      { status: 400 },
    );
  }
  const catalogId = (body.catalog_id ?? "").trim();
  if (!catalogId) {
    return Response.json(
      { ok: false, error: "catalog_id wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const hasil = await db.runTransaction(async (tx) => {
      const catalogRef = db.collection("reward_catalog").doc(catalogId);
      const wargaRef = db.collection("BUMDes_rewards").doc(uid);

      const [catalogSnap, wargaSnap] = await Promise.all([
        tx.get(catalogRef),
        tx.get(wargaRef),
      ]);

      if (!catalogSnap.exists) throw new GagalTukar(404, "Hadiah tidak ditemukan.");
      const hadiah = catalogSnap.data()!;
      if (hadiah.aktif === false) {
        throw new GagalTukar(409, "Hadiah sedang tidak tersedia.");
      }

      if (!wargaSnap.exists) throw new GagalTukar(404, "Data warga tidak ditemukan.");
      const warga = wargaSnap.data()!;
      const poinSekarang: number = warga.total_poin ?? 0;
      const biaya: number = hadiah.pointsRequired ?? 0;

      if (poinSekarang < biaya) {
        throw new GagalTukar(
          400,
          `Poin tidak cukup. Dibutuhkan ${biaya}, dimiliki ${poinSekarang}.`,
        );
      }

      // Ambil satu voucher yang masih tersedia.
      // Query di dalam transaksi ikut terkunci, jadi dua permintaan bersamaan
      // tidak akan mendapat kode yang sama.
      const voucherQuery = db
        .collection("voucher_stock")
        .where("reward_id", "==", catalogId)
        .where("is_used", "==", false)
        .limit(1);
      const voucherSnap = await tx.get(voucherQuery);
      if (voucherSnap.empty) {
        throw new GagalTukar(409, "Stok kode untuk hadiah ini habis.");
      }
      const voucherDoc = voucherSnap.docs[0];
      const kode: string = voucherDoc.data().code;

      const waktu = Timestamp.now();

      tx.update(voucherDoc.ref, {
        is_used: true,
        used_by_uid: uid,
        used_at: waktu,
      });
      tx.update(wargaRef, { total_poin: poinSekarang - biaya });
      tx.set(db.collection("redemption_history").doc(), {
        user_id: uid,
        nama_warga: warga.nama_warga ?? "",
        catalog_id: catalogId,
        nama_hadiah: hadiah.name ?? "",
        biaya_poin: biaya,
        kode_diberikan: kode,
        timestamp: waktu,
      });

      return {
        kode,
        sisa_poin: poinSekarang - biaya,
        nama_hadiah: hadiah.name ?? "",
      };
    });

    return Response.json({ ok: true, ...hasil });
  } catch (err) {
    if (err instanceof GagalTukar) {
      return Response.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }
    const detail = err instanceof Error ? err.message : "Gagal menukar.";
    console.error("redeem gagal:", detail);
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}

/** Kegagalan yang sudah punya pesan siap tampil ke warga. */
class GagalTukar extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
