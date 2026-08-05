# IslandGrid AI — Dashboard Operator (Web)

Dashboard operator BUMDes/PLTD Pulau Siberut. Next.js + Firebase + Recharts.
Bagian **web** dari sistem IslandGrid AI (ML FastAPI + Mobile Android + Web).

## Fitur
- **Login** role-based (allowlist Firestore `operators/{uid}`): Admin BUMDes / Teknisi PLTD (menu Manajemen Poin disembunyikan untuk teknisi).
- **Dashboard** real-time: dua badge status sesuai kontrak ML (*Kondisi Saat Ini* dari `current_operating_status`, *Risiko 48 Jam* dari `forecast_risk_status`), kurva kesetimbangan daya (Recharts), cuaca, indikator data basi, tombol Perbarui Prediksi.
- **Jam Emas AI** dihitung dari data Firestore (`src/lib/greenHours.ts`) — bukan hardcode, dan tidak bergantung pada layanan ML.
- **Kalkulator BBM** solar (slider kepatuhan + gauge).
- **Notifikasi**: broadcast **FCM dikirim langsung oleh web** (`/api/broadcast`, firebase-admin server-side) ke topic `WARGA` + catat ke `broadcast_notifications`; pengatur poin insentif.
- **Manajemen Poin** BUMDes: peringkat warga + persetujuan penukaran.

## Integrasi tim

Firestore adalah penghubung antar tim — web tetap berfungsi penuh walau layanan ML mati.

| Koleksi | Ditulis oleh | Dibaca web |
|---|---|---|
| `system_status/siberut_grid` | pipeline ML | ✅ |
| `power_forecasts/{YYYY-MM-DD_HH}` | pipeline ML | ✅ |
| `BUMDes_rewards`, `operators`, `reward_catalog`, `voucher_stock` | web | ✅ |
| `broadcast_notifications` | web | mobile |

Mengacu pada `docs/FIRESTORE_CONTRACT.md` di repo [zhhraid/islandgrid-ai-ml](https://github.com/zhhraid/islandgrid-ai-ml). Kapasitas asli Siberut: **PLTS 75 kWp**, **PLTD 50 kW**, 327 rumah tangga.

> ⚠️ **`power_forecasts` milik pipeline ML.** Kontrak mereka: dokumen lama tidak pernah dihapus. `npm run seed` sengaja **melewati** koleksi ini kalau sudah berisi data. Flag `--force-forecasts` menimpanya — jangan dipakai kecuali yakin belum ada data ML.

## Jalankan
```bash
npm install
npm run dev
```
Buka http://localhost:3000. **Firebase wajib dikonfigurasi** (lihat bawah) — login
selalu lewat Firebase Auth, tidak ada mode demo tanpa autentikasi.

Akun operator (kata sandi `password123`):
| Email | Peran |
|---|---|
| `admin@bumdes.id` | Admin BUMDes — akses penuh |
| `teknisi@bumdes.id` | Teknisi PLTD — tanpa Sesi, Verifikasi, Hadiah & Poin |

## Aktifkan Firebase (data real)
1. Isi `.env.local` dari Firebase Console (Project settings > Web app config):
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `MESSAGING_SENDER_ID`, `APP_ID` (yang lain sudah terisi).
2. Download service account (Project settings > Service accounts > Generate new private key) → simpan `serviceAccountKey.json` di folder ini.
3. Seed data + buat akun operator:
   ```bash
   npm run seed
   ```
   Login: `admin@bumdes.id` / `teknisi@bumdes.id` — password `password123`.
4. FCM aktif otomatis begitu service account tersedia. Tanpa kredensial → balasan `mode: "mock"` (tidak error).

Agar notifikasi sampai ke HP, aplikasi Android harus **subscribe topic `WARGA`**.

## Test
```bash
npm test        # 40 unit test: fuel, greenHours, gridThresholds, verification, photo
```

Foto bukti demo dibuat oleh `scripts/fotoContoh.ts` (PNG 480×320, tanpa dependensi
tambahan). Untuk mengganti foto placeholder lama di Firestore tanpa menyentuh
kiriman asli dari mobile:
```bash
npx tsx scripts/perbaikiFotoDemo.ts
```

## Build & Deploy VPS
```bash
npm run build   # output: standalone
pm2 start .next/standalone/server.js --name islandgrid-web
```
Salin `.next/static` → `.next/standalone/.next/static` dan `public` → `.next/standalone/public`.
Reverse proxy nginx ke :3000 + TLS (certbot).

Di produksi jangan menyertakan file kunci — isi `FIREBASE_SERVICE_ACCOUNT_JSON` (isi JSON dalam satu baris) sebagai env.

## Menjalankan layanan ML di VPS yang sama (opsional)

Mengaktifkan tombol **Perbarui Prediksi** dan pembaruan prediksi otomatis.

```bash
git clone https://github.com/zhhraid/islandgrid-ai-ml.git && cd islandgrid-ai-ml
docker build -t islandgrid-ml .
docker run -d --name islandgrid-ml --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  -e FIREBASE_PROJECT_ID=islandgrid-ai \
  -e ISLANDGRID_FIRESTORE_SCHEMA=snake_case \
  -e ISLANDGRID_API_KEY=<kunci> \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/sa.json \
  -v /path/serviceAccount.json:/app/sa.json:ro \
  islandgrid-ml
```
Port sengaja di-bind ke `127.0.0.1` — API ML tidak terbuka ke internet, web memanggilnya dari dalam server.
Lalu isi di `.env.local` web: `ISLANDGRID_API_BASE_URL=http://127.0.0.1:8080` + `ISLANDGRID_API_KEY`.

Cron pembaruan otomatis (aaPanel → Cron → Shell Script, tiap 3 jam):
```bash
docker exec islandgrid-ml python scripts/scheduler.py --run-once
```
Butuh artefak model `artifacts/model_plts_siberut.pkl` + `model_metadata.json` dari tim ML.

## Aturan keamanan Firestore

`firestore.rules` ada di folder ini. Tempel isinya di Firebase Console →
Firestore Database → Rules → **Publish**. Tanpa itu, siapa pun yang login bisa
mengubah poin dan katalog hadiah langsung dari klien.

Ringkas: operator dibaca dari `operators/{uid}`; warga hanya boleh membuat
`participation_requests` miliknya sendiri, **mengurangi** poinnya sendiri saat
menukar hadiah, dan menandai satu voucher jadi terpakai. Menaikkan poin hanya
bisa lewat Admin SDK (server).

> Konstanta kalkulator BBM di `src/lib/fuel.ts` — konfirmasi angka domain ke tim.
