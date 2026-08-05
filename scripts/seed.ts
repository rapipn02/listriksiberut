/**
 * Seed data dummy ke Firestore + buat akun operator.
 * Butuh service account: set GOOGLE_APPLICATION_CREDENTIALS di .env.local
 * (Firebase Console > Project settings > Service accounts > Generate new private key).
 *
 * Jalankan:  npm run seed
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { fotoContohBase64 } from "./fotoContoh";

config({ path: ".env.local" });

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./serviceAccountKey.json";
if (!existsSync(keyPath)) {
  console.error(`\n❌ Service account tidak ditemukan di: ${keyPath}`);
  console.error(
    "   Download dari Firebase Console > Project settings > Service accounts,\n" +
      "   simpan sebagai serviceAccountKey.json di folder web/, lalu jalankan lagi.\n",
  );
  process.exit(1);
}

// Guard: menimpa power_forecasts berisiko menghapus data pipeline ML.
const FORCE_FORECASTS = process.argv.includes("--force-forecasts");

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const OPERATORS = [
  { email: "admin@bumdes.id", password: "password123", nama: "Rudi Saputra", role: "admin_bumdes" },
  { email: "teknisi@bumdes.id", password: "password123", nama: "Andi Wijaya", role: "teknisi_pltd" },
];

const WARGA = [
  { user_id: "warga_java", nama_warga: "Java Maulana", nomor_hp: "081234567890", total_poin: 150 },
  { user_id: "warga_siti", nama_warga: "Siti Rahma", nomor_hp: "082198765432", total_poin: 132 },
  { user_id: "warga_rudi", nama_warga: "Rudi Hartono", nomor_hp: "081377788899", total_poin: 118 },
  { user_id: "warga_nia", nama_warga: "Nia Kurnia", nomor_hp: "085611122233", total_poin: 96 },
  { user_id: "warga_doni", nama_warga: "Doni Saputra", nomor_hp: "087822233344", total_poin: 74 },
  { user_id: "warga_lastri", nama_warga: "Lastri Wulandari", nomor_hp: "089955566677", total_poin: 58 },
];

async function ensureOperator(op: (typeof OPERATORS)[number]) {
  let uid: string;
  try {
    const u = await auth.getUserByEmail(op.email);
    uid = u.uid;
  } catch {
    const u = await auth.createUser({ email: op.email, password: op.password });
    uid = u.uid;
  }
  await db.collection("operators").doc(uid).set({
    email: op.email,
    nama: op.nama,
    aktif: true,
    role: op.role,
  });
  console.log(`  operator ${op.email} (${op.role}) -> ${uid}`);
}

// Skala realistis terhadap kapasitas asli: PLTS 75 kWp nameplate, PLTD 50 kW.
// Puncak surya ~55 kW (efisiensi nyata < nameplate), beban 30-60 kW untuk 327 rumah tangga.
function buildForecasts() {
  const now = new Date();
  const docs: { id: string; data: Record<string, unknown> }[] = [];
  for (let h = 0; h < 24; h++) {
    const d = new Date(now.getTime() + h * 3600_000);
    const hour = d.getHours();
    const plts = Math.round(55 * Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI)));
    const load = Math.round(
      32 + 26 * Math.exp(-((hour - 19) ** 2) / 8) + 13 * Math.exp(-((hour - 8) ** 2) / 6),
    );
    const id = `${d.toISOString().slice(0, 10)}_${String(hour).padStart(2, "0")}`;
    docs.push({
      id,
      data: {
        timestamp: Timestamp.fromDate(d),
        predicted_plts_kw: plts,
        projected_load_kw: load,
        cloud_cover_percent: 75,
        ghi_radiation: 320,
        deficit_flag: load > plts,
      },
    });
  }
  return docs;
}

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  dibersihkan: ${snap.size} dokumen lama di ${name}`);
}

async function main() {
  console.log("Seeding operators…");
  for (const op of OPERATORS) await ensureOperator(op);

  console.log("Seeding system_status…");
  // Kapasitas asli dari tim ML (docs/FIRESTORE_CONTRACT.md): PLTS 75 kWp, PLTD 50 kW.
  //
  // merge: true — WAJIB. Dokumen ini milik pipeline ML dan berisi metadata
  // mereka (model_version, critical_timestamp, minimum_grid_margin_kw).
  // Tanpa merge, seed akan menghapusnya dan mobile kehilangan model_version.
  const statusSnap = await db.collection("system_status").doc("siberut_grid").get();
  const adaDataML = Boolean(statusSnap.data()?.model_version);
  await db.collection("system_status").doc("siberut_grid").set(
    adaDataML
      ? // Sudah ada data ML — jangan sentuh status/kapasitasnya sama sekali.
        { updated_at: statusSnap.data()?.updated_at ?? Timestamp.now() }
      : {
          current_status: "ALERT",
          current_operating_status: "WARNING",
          forecast_risk_status: "ALERT",
          status_basis: "worst_status_in_forecast_horizon",
          total_plts_capacity_kw: 75,
          total_pltd_capacity_kw: 50,
          updated_at: Timestamp.now(),
        },
    { merge: true },
  );
  if (adaDataML) {
    console.log("  data ML terdeteksi — status & kapasitas dipertahankan.");
  }

  // PENTING: power_forecasts adalah milik pipeline ML.
  // Kontrak tim ML: "Old forecasts are never deleted" — seed TIDAK BOLEH menghapusnya.
  // Hanya isi kalau koleksi masih kosong (belum ada data ML sama sekali).
  const existingForecasts = await db.collection("power_forecasts").limit(1).get();
  if (!existingForecasts.empty && !FORCE_FORECASTS) {
    console.log(
      "Melewati power_forecasts — sudah ada data (kemungkinan dari pipeline ML).\n" +
        "  Data ML dipertahankan. Pakai `npm run seed -- --force-forecasts` untuk menimpa paksa.",
    );
  } else {
    if (FORCE_FORECASTS && !existingForecasts.empty) {
      console.log("⚠️  --force-forecasts: menimpa power_forecasts yang sudah ada.");
      await clearCollection("power_forecasts");
    }
    console.log("Seeding power_forecasts (24 jam dummy)…");
    const batch = db.batch();
    for (const f of buildForecasts()) {
      batch.set(db.collection("power_forecasts").doc(f.id), f.data);
    }
    await batch.commit();
  }

  console.log("Seeding BUMDes_rewards…");
  // Bersihkan dokumen contoh lama (dari setup awal project, sebelum seed script ada).
  await db.collection("BUMDes_rewards").doc("dummy_user_java_maulana").delete().catch(() => {});
  for (const w of WARGA) {
    await db.collection("BUMDes_rewards").doc(w.user_id).set(w);
  }

  // redemption_requests dari desain lama (approve manual) sudah tidak dipakai —
  // penukaran kini instan lewat /api/redeem.
  await clearCollection("redemption_requests");

  console.log("Seeding settings…");
  await db.collection("settings").doc("notifikasi").set(
    { poin_per_partisipasi: 25, auto_broadcast_aktif: true },
    { merge: true },
  );

  console.log("Seeding users (profil warga, ditulis mobile)…");
  for (const w of WARGA) {
    await db.collection("users").doc(w.user_id).set({
      uid: w.user_id,
      nama: w.nama_warga,
      email: `${w.user_id}@warga.siberut.id`,
      phone: w.nomor_hp,
      role: "WARGA",
    });
  }

  console.log("Seeding reward_catalog…");
  await clearCollection("reward_catalog");
  const KATALOG = [
    {
      id: "token_listrik_20rb",
      name: "Token Listrik 20rb",
      pointsRequired: 120,
      iconType: "FLASH",
      type: "DIGITAL",
      deskripsi: "Kode token PLN prabayar senilai Rp 20.000.",
      aktif: true,
    },
    {
      id: "voucher_air_desa",
      name: "Potongan Iuran Air Desa",
      pointsRequired: 80,
      iconType: "WATER",
      type: "DIGITAL",
      deskripsi: "Potongan iuran air bersih desa satu bulan.",
      aktif: true,
    },
    {
      id: "paket_sembako",
      name: "Paket Sembako BUMDes",
      pointsRequired: 200,
      iconType: "SHOPPING",
      type: "DIGITAL",
      deskripsi: "Beras 2kg, minyak goreng, gula.",
      aktif: true,
    },
  ];
  for (const k of KATALOG) {
    const { id, ...data } = k;
    await db.collection("reward_catalog").doc(id).set(data);
  }

  console.log("Seeding voucher_stock (kode dummy)…");
  await clearCollection("voucher_stock");
  await clearCollection("digital_vouchers"); // nama koleksi lama, tidak dipakai lagi
  const voucherBatch = db.batch();
  const PREFIKS: Record<string, string> = {
    token_listrik_20rb: "PLN",
    voucher_air_desa: "AIR",
    paket_sembako: "SMB",
  };
  for (const rewardId of Object.keys(PREFIKS)) {
    for (let i = 1; i <= 8; i++) {
      voucherBatch.set(db.collection("voucher_stock").doc(), {
        reward_id: rewardId,
        code: `${PREFIKS[rewardId]}-${1000 + i}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
        is_used: false,
      });
    }
  }
  await voucherBatch.commit();

  console.log("Seeding load_shift_sessions + participation_requests (demo)…");
  await clearCollection("broadcast_windows"); // koleksi lama, tidak dipakai lagi
  await clearCollection("load_shift_sessions");
  await clearCollection("participation_requests");

  const sekarang = Date.now();
  const BULAN_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const jamWib = (ms: number) => {
    const bagian = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta",
    }).formatToParts(new Date(ms));
    const g = (t: string) => bagian.find((p) => p.type === t)?.value ?? "00";
    return `${g("hour")}:${g("minute")}`;
  };
  const tanggalId = (ms: number) => {
    const d = new Date(ms);
    return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Sesi yang SEDANG BERJALAN — tombol kirim bukti di HP warga menyala,
  // sekaligus jadi acuan mesin verifikasi menilai foto demo di bawah.
  const mulaiMs = sekarang - 2 * 3600_000;
  const selesaiMs = sekarang + 2 * 3600_000;
  const sesiRef = db.collection("load_shift_sessions").doc();
  await sesiRef.set({
    date: tanggalId(mulaiMs),
    startTime: jamWib(mulaiMs),
    endTime: jamWib(selesaiMs),
    status: "ACTIVE",
    targetSavingKwh: 30,
    capacityKw: 50,
    currentLoadKw: 42,
    participantCount: 0,
    poin_per_partisipasi: 25,
    dibuat_oleh: "sistem",
    startAt: Timestamp.fromMillis(mulaiMs),
    endAt: Timestamp.fromMillis(selesaiMs),
  });

  // Sesi besok siang — contoh status UPCOMING.
  const besokMulai = sekarang + 20 * 3600_000;
  const besokSelesai = sekarang + 25 * 3600_000;
  await db.collection("load_shift_sessions").add({
    date: tanggalId(besokMulai),
    startTime: jamWib(besokMulai),
    endTime: jamWib(besokSelesai),
    status: "UPCOMING",
    targetSavingKwh: 40,
    capacityKw: 50,
    currentLoadKw: 0,
    participantCount: 0,
    poin_per_partisipasi: 25,
    dibuat_oleh: "operator",
    startAt: Timestamp.fromMillis(besokMulai),
    endAt: Timestamp.fromMillis(besokSelesai),
  });

  // Satu pengajuan bisa berisi beberapa foto — mobile mengirimnya sebagai
  // array Base64. Foto contoh dibuat 480×320 (bukan 1×1 piksel seperti dulu)
  // supaya halaman Verifikasi benar-benar memperlihatkan gambar.
  const PENGAJUAN = [
    // Dalam jendela → seharusnya DISETUJUI
    { userId: "warga_java", userName: "Java Maulana", offsetMenit: -60, foto: 3 },
    { userId: "warga_siti", userName: "Siti Rahma", offsetMenit: -45, foto: 2 },
    // Dobel dari warga sama di jendela sama → seharusnya DITOLAK
    { userId: "warga_java", userName: "Java Maulana", offsetMenit: -20, foto: 1 },
    // Jauh di luar jendela → seharusnya DITOLAK
    { userId: "warga_rudi", userName: "Rudi Hartono", offsetMenit: -600, foto: 4 },
  ];
  for (const p of PENGAJUAN) {
    await db.collection("participation_requests").add({
      userId: p.userId,
      userName: p.userName,
      timestamp: Timestamp.fromMillis(sekarang + p.offsetMenit * 60_000),
      goldenHourRange: "10:00-14:00",
      photosBase64: Array.from({ length: p.foto }, (_, i) => fotoContohBase64(i)),
      status: "PENDING",
    });
  }

  console.log("\n✅ Selesai. Login demo: admin@bumdes.id / teknisi@bumdes.id — password: password123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
