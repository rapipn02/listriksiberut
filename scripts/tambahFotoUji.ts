/**
 * Tambah satu pengajuan uji ke participation_requests memakai berkas gambar
 * sungguhan dari komputer. Dipakai untuk membuktikan halaman Verifikasi
 * menampilkan foto asli (bukan hanya foto contoh buatan skrip).
 *
 * Dua salinan ditulis dalam satu dokumen — PNG transparan dan JPEG hasil
 * kompresi — sekaligus menguji pendeteksian jenis berkas di src/lib/photo.ts.
 *
 * Jalankan:  npx tsx scripts/tambahFotoUji.ts [berkas.png]
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import sharp from "sharp";

config({ path: ".env.local" });

const BERKAS = process.argv[2] ?? "scripts/assets/logo-sumber.png";

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./serviceAccountKey.json";
if (!existsSync(keyPath)) {
  console.error(`❌ Service account tidak ditemukan di: ${keyPath}`);
  process.exit(1);
}
if (!existsSync(BERKAS)) {
  console.error(`❌ Berkas gambar tidak ditemukan: ${BERKAS}`);
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, "utf8"))) });
const db = getFirestore();

/** Batas aman satu dokumen Firestore: 1 MiB, sisakan ruang untuk field lain. */
const BATAS_TOTAL_BYTE = 700 * 1024;

async function main() {
  const asli = readFileSync(BERKAS);
  const meta = await sharp(asli).metadata();

  // Salinan 1: PNG apa adanya, dikecilkan bila lebih dari 1024 px.
  const png = await sharp(asli)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Salinan 2: JPEG di atas latar putih — meniru foto kamera HP yang
  // dikompres aplikasi mobile sebelum dikirim.
  const jpeg = await sharp(asli)
    .flatten({ background: "#ffffff" })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const fotos = [png.toString("base64"), jpeg.toString("base64")];
  const total = fotos.reduce((t, f) => t + (f.length * 3) / 4, 0);
  if (total > BATAS_TOTAL_BYTE) {
    console.error(
      `❌ Total ${Math.round(total / 1024)} KB melebihi batas aman ${BATAS_TOTAL_BYTE / 1024} KB.`,
    );
    process.exit(1);
  }

  const ref = await db.collection("participation_requests").add({
    userId: "warga_nia",
    userName: "Nia Kurnia",
    timestamp: Timestamp.now(), // dalam sesi aktif → mesin harusnya menyetujui
    goldenHourRange: "10:00-14:00",
    photosBase64: fotos,
    status: "PENDING",
  });

  console.log(`sumber   : ${BERKAS} (${meta.format} ${meta.width}x${meta.height})`);
  console.log(`foto 1   : PNG  ${Math.round(png.length / 1024)} KB`);
  console.log(`foto 2   : JPEG ${Math.round(jpeg.length / 1024)} KB`);
  console.log(`dokumen  : participation_requests/${ref.id} — status PENDING`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
