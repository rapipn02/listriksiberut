// Auto-Broadcast: kirim imbauan ke warga TANPA campur tangan operator.
//
// Dipanggil cron VPS tiap 15 menit. Bila beban diprediksi >= 90% kapasitas PLTD
// (atau ditandai defisit) dalam 3 jam ke depan, kirim FCM + buat jendela imbauan.
// Jendela itu kemudian jadi acuan mesin verifikasi menilai foto warga.
import { Timestamp } from "firebase-admin/firestore";
import { getAdmin, FCM_TOPIC } from "@/lib/firebaseAdmin";
import { cronDiizinkan, tolakCron } from "@/lib/cronAuth";
import {
  evaluasiAmbang,
  susunPesanOtomatis,
  type TitikBeban,
} from "@/lib/gridThresholds";
import { findGreenWindow } from "@/lib/greenHours";

/** Lama jendela imbauan berlaku setelah dikirim. */
const DURASI_JENDELA_JAM = 4;

/**
 * Format jam WIB sebagai "HH:MM".
 * Tidak memakai toLocaleTimeString("id-ID") karena locale Indonesia memisahkan
 * jam dengan titik ("10.00"), sedangkan aplikasi mobile mengharapkan titik dua.
 */
function jamWib(d: Date): string {
  const bagian = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const jam = bagian.find((p) => p.type === "hour")?.value ?? "00";
  const menit = bagian.find((p) => p.type === "minute")?.value ?? "00";
  return `${jam}:${menit}`;
}

const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "31 Juli 2026" dalam zona WIB — format yang dipakai aplikasi mobile. */
function tanggalId(d: Date): string {
  const bagian = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).formatToParts(d);
  const ambil = (t: string) => bagian.find((p) => p.type === t)?.value ?? "";
  return `${Number(ambil("day"))} ${BULAN_ID[Number(ambil("month")) - 1]} ${ambil("year")}`;
}

export async function POST(request: Request) {
  if (!cronDiizinkan(request)) return tolakCron();

  const admin = getAdmin();
  if (!admin) {
    return Response.json(
      { ok: false, error: "Kredensial admin belum dikonfigurasi." },
      { status: 503 },
    );
  }
  const { db, messaging } = admin;
  const sekarang = Date.now();

  try {
    // Saklar di Pengaturan bisa mematikan otomasi ini.
    const setelan = await db.collection("settings").doc("notifikasi").get();
    if (setelan.exists && setelan.data()?.auto_broadcast_aktif === false) {
      return Response.json({
        ok: true,
        triggered: false,
        alasan: "Auto-broadcast dimatikan di Pengaturan.",
      });
    }
    const poinPerPartisipasi = setelan.data()?.poin_per_partisipasi ?? 25;

    // Kapasitas + prakiraan terdekat.
    const statusSnap = await db
      .collection("system_status")
      .doc("siberut_grid")
      .get();
    const kapasitasPltd = statusSnap.data()?.total_pltd_capacity_kw ?? 0;

    // Ambil 24 jam: ambang peringatan hanya memakai 3 jam pertama (difilter di
    // dalam evaluasiAmbang), tapi pencarian Jam Emas butuh rentang penuh —
    // saat malam, surplus surya baru muncul besok siang.
    const fcSnap = await db
      .collection("power_forecasts")
      .where("timestamp", ">=", Timestamp.fromMillis(sekarang - 3600_000))
      .where("timestamp", "<", Timestamp.fromMillis(sekarang + 24 * 3600_000))
      .orderBy("timestamp", "asc")
      .limit(25)
      .get();

    const titik: TitikBeban[] = fcSnap.docs.map((d) => {
      const v = d.data();
      const waktu: Date = v.timestamp.toDate();
      return {
        jam: jamWib(waktu),
        offsetJam: Math.round((waktu.getTime() - sekarang) / 3600_000),
        bebanKw: v.projected_load_kw,
        pltsKw: v.predicted_plts_kw,
        deficitFlag: Boolean(v.deficit_flag),
      };
    });

    // Jam Emas dihitung dari prakiraan — dipakai sebagai jendela sesi otomatis.
    const jamEmas = findGreenWindow(
      titik.map((t) => ({
        jam: t.jam,
        beban: t.bebanKw,
        plts: t.pltsKw,
        deficit: t.deficitFlag,
      })),
    );

    const hasil = evaluasiAmbang(titik, kapasitasPltd);
    if (!hasil.perluKirim) {
      return Response.json({
        ok: true,
        triggered: false,
        alasan: hasil.alasan,
        jam_emas: jamEmas ? `${jamEmas.mulai}-${jamEmas.selesai}` : null,
      });
    }

    // Anti-spam: sudah ada sesi otomatis yang masih berjalan?
    // Filter hanya pada satu field (range) supaya tidak memerlukan composite
    // index yang harus dibuat manual di Console; sisanya disaring di memori —
    // jumlah sesi yang masih aktif selalu sedikit.
    const sesiSnap = await db
      .collection("load_shift_sessions")
      .where("endAt", ">", Timestamp.fromMillis(sekarang))
      .get();
    const adaSesiOtomatis = sesiSnap.docs.some(
      (d) => d.data().dibuat_oleh === "sistem",
    );
    if (adaSesiOtomatis) {
      return Response.json({
        ok: true,
        triggered: false,
        alasan: "Imbauan otomatis masih berlaku, tidak dikirim ulang.",
      });
    }

    const pesan = susunPesanOtomatis(hasil);

    await messaging.send({
      topic: FCM_TOPIC,
      notification: { title: pesan.title, body: pesan.message },
      android: { priority: "high" },
      data: { type: "auto_alert" },
    });

    const batch = db.batch();
    batch.set(db.collection("broadcast_notifications").doc(), {
      title: pesan.title,
      message: pesan.message,
      target_topic: FCM_TOPIC,
      timestamp: Timestamp.fromMillis(sekarang),
      dibuat_oleh: "sistem",
    });
    // Buat sesi load shifting otomatis. Mobile menyalakan tombol "kirim bukti"
    // begitu ada sesi ACTIVE, jadi warga bisa langsung berpartisipasi.
    const mulai = new Date(sekarang);
    const selesai = new Date(sekarang + DURASI_JENDELA_JAM * 3600_000);
    const sesiRef = db.collection("load_shift_sessions").doc();
    batch.set(sesiRef, {
      date: tanggalId(mulai),
      startTime: jamWib(mulai),
      endTime: jamWib(selesai),
      status: "ACTIVE",
      // Target hemat kasar: kelebihan beban di atas kapasitas × durasi.
      targetSavingKwh:
        Math.round(
          Math.max(0, (hasil.pemicu?.bebanKw ?? 0) - kapasitasPltd) *
            DURASI_JENDELA_JAM *
            10,
        ) / 10,
      capacityKw: kapasitasPltd,
      currentLoadKw: hasil.pemicu?.bebanKw ?? 0,
      participantCount: 0,
      poin_per_partisipasi: poinPerPartisipasi,
      dibuat_oleh: "sistem",
      alasan: hasil.alasan,
      startAt: Timestamp.fromMillis(sekarang),
      endAt: Timestamp.fromMillis(sekarang + DURASI_JENDELA_JAM * 3600_000),
    });
    await batch.commit();

    return Response.json({
      ok: true,
      triggered: true,
      alasan: hasil.alasan,
      session_id: sesiRef.id,
      berlaku_sampai_jam: DURASI_JENDELA_JAM,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Gagal";
    console.error("auto-broadcast gagal:", detail);
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
