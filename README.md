# IslandGrid AI — Dashboard Operator

Dashboard operator BUMDes/PLTD Pulau Siberut, Mentawai. Memantau kesetimbangan
daya PLTS + PLTD, mengumumkan Jam Emas ke warga, memverifikasi bukti partisipasi,
dan mengelola poin serta hadiah.

Next.js 16 · React 19 · Firebase (Auth + Firestore) · Tailwind 4 · Recharts


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

