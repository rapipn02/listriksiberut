# IslandGrid AI — Dashboard Operator

Dashboard operator BUMDes/PLTD Pulau Siberut, Mentawai. Memantau kesetimbangan
daya PLTS + PLTD, mengumumkan Jam Emas ke warga, memverifikasi bukti partisipasi,
dan mengelola poin serta hadiah.

Next.js 16 · React 19 · Firebase (Auth + Firestore) · Tailwind 4 · Recharts

---

## Menjalankan

```bash
git clone https://github.com/rapipn02/listriksiberut.git
cd listriksiberut
npm install
cp .env.example .env.local     # lalu isi nilainya, lihat tabel di bawah
npm run dev                    # http://localhost:3000
```

Firebase **wajib** dikonfigurasi — login memakai Firebase Auth, tidak ada mode
demo tanpa autentikasi.

### Isi `.env.local`

| Variabel | Diambil dari |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `MESSAGING_SENDER_ID`, `APP_ID` | Firebase Console → Project settings → General → Your apps |
| `GOOGLE_APPLICATION_CREDENTIALS` | Project settings → Service accounts → Generate new private key, simpan sebagai `serviceAccountKey.json` di folder ini (**jangan commit** — sudah di `.gitignore`) |
| `CRON_SECRET` | bebas, buat acak: `openssl rand -hex 32` |
| `ISLANDGRID_API_BASE_URL` | alamat layanan prediksi ML (opsional, boleh kosong saat pengembangan lokal) |

Sisanya sudah terisi nilai default di `.env.example`.

### Menyiapkan data + akun operator

```bash
npm run seed
```

Membuat akun operator (`admin@bumdes.id` / `teknisi@bumdes.id`, kata sandi
`password123`), warga contoh, katalog hadiah, stok voucher, sesi Jam Emas yang
sedang berjalan, dan beberapa pengajuan bukti foto untuk dicoba.

> Koleksi `power_forecasts` milik pipeline ML — seed sengaja melewatinya bila
> sudah berisi data, supaya tidak menimpa hasil tim ML yang sedang jalan.

### Verifikasi instalasi

```bash
npm test        # 65 unit test harus lolos
npx tsc --noEmit
npm run build
```

## Peran

Login di `/login`. Kata sandi kedua akun: `password123`.

| Akun | Peran | Bisa mengakses |
|---|---|---|
| `admin@bumdes.id` | Admin BUMDes | seluruh halaman |
| `teknisi@bumdes.id` | Teknisi PLTD | Dashboard, Kalkulator BBM, Notifikasi, Pengaturan, Bantuan |

Teknisi tidak melihat menu **Sesi Jam Emas**, **Verifikasi**, **Hadiah**, dan
**Manajemen Poin** — semua yang menyangkut poin dan uang hanya untuk Admin
BUMDes. Peran dibaca dari koleksi `operators/{uid}` di Firestore, bukan dari
klien, jadi tidak bisa dipalsukan lewat browser.

---

## Halaman

| Halaman | Isi |
|---|---|
| Dashboard | status grid, kurva kesetimbangan daya 24 jam, Jam Emas, cuaca, hitung mundur defisit |
| Kalkulator BBM | penghematan solar, biaya, dan emisi menurut tingkat kepatuhan warga |
| Notifikasi | kirim imbauan FCM ke warga + riwayat broadcast |
| Sesi Jam Emas | buat/ubah jadwal sesi; status berpindah otomatis UPCOMING → ACTIVE → ENDED |
| Verifikasi | bukti foto warga dinilai mesin aturan; operator bisa menimpa keputusannya |
| Hadiah | katalog hadiah, stok kode voucher, riwayat penukaran |
| Manajemen Poin | peringkat poin warga |

---

