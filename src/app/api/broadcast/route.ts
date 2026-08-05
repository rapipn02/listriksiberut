// Broadcast alert ke warga.
// Web mengirim FCM sendiri (tim ML tidak menyediakan endpoint FCM), memakai
// firebase-admin server-side. Cloud Functions tidak dipakai karena project
// masih di Spark plan.
//
// Alur: kirim FCM ke topic warga_siberut -> catat ke koleksi broadcast_notifications.
// Tanpa kredensial admin: lewati FCM, tetap catat, balas mode "mock".
import { Timestamp } from "firebase-admin/firestore";
import { getAdmin, FCM_TOPIC } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  let body: { title?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Body tidak valid" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!title || !message) {
    return Response.json(
      { ok: false, error: "Judul & pesan wajib diisi" },
      { status: 400 },
    );
  }

  const admin = getAdmin();
  if (!admin) {
    // Mode demo — kredensial belum dipasang.
    return Response.json({ ok: true, mode: "mock", recipients: FCM_TOPIC });
  }

  try {
    const messageId = await admin.messaging.send({
      topic: FCM_TOPIC,
      notification: { title, body: message },
      android: { priority: "high" },
      data: { type: "broadcast_alert" },
    });

    await admin.db.collection("broadcast_notifications").add({
      title,
      message,
      target_topic: FCM_TOPIC,
      timestamp: Timestamp.now(),
    });

    return Response.json({ ok: true, mode: "fcm", messageId, topic: FCM_TOPIC });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Gagal mengirim broadcast";
    console.error("Broadcast gagal:", detail);
    return Response.json({ ok: false, error: detail }, { status: 502 });
  }
}
