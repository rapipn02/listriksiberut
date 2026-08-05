/**
 * Ganti foto placeholder 1×1 piksel pada participation_requests dengan foto
 * contoh 480×320 berjumlah beberapa buah per pengajuan.
 *
 * AMAN untuk data sungguhan: hanya dokumen yang SELURUH fotonya berukuran
 * di bawah 1 KB (ciri placeholder lama) yang disentuh. Kiriman asli dari
 * aplikasi mobile jauh lebih besar, jadi tidak akan tertimpa.
 *
 * Jalankan:  npx tsx scripts/perbaikiFotoDemo.ts
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fotoContohBase64 } from "./fotoContoh";

config({ path: ".env.local" });

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./serviceAccountKey.json";
if (!existsSync(keyPath)) {
  console.error(`❌ Service account tidak ditemukan di: ${keyPath}`);
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, "utf8"))) });
const db = getFirestore();

/** Batas ukuran yang dianggap placeholder, bukan foto sungguhan. */
const BATAS_BYTE = 1024;

async function main() {
  const snap = await db.collection("participation_requests").get();
  let diubah = 0;
  let dilewati = 0;

  for (const doc of snap.docs) {
    const foto: unknown = doc.get("photosBase64");
    const daftar = Array.isArray(foto) ? (foto as string[]) : [];
    const semuaKecil =
      daftar.length > 0 &&
      daftar.every((f) => typeof f === "string" && (f.length * 3) / 4 < BATAS_BYTE);

    if (!semuaKecil) {
      dilewati++;
      continue;
    }

    // Jumlah foto dibuat bervariasi (1–4) agar tampilan banyak-foto teruji.
    const jumlah = (diubah % 4) + 1;
    await doc.ref.update({
      photosBase64: Array.from({ length: jumlah }, (_, i) => fotoContohBase64(i)),
    });
    console.log(
      `✔ ${doc.get("userName") ?? doc.id}: ${daftar.length} → ${jumlah} foto`,
    );
    diubah++;
  }

  console.log(`\nSelesai. ${diubah} diperbarui, ${dilewati} dilewati (foto asli).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
