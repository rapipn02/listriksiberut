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

## Perintah lain

```bash
npm test        # 40 unit test (kalkulator, Jam Emas, ambang beban, verifikasi, foto)
npm run build   # build produksi (output standalone)
npm run lint
```

---

## Keamanan Firestore

Tempel isi `firestore.rules` di Firebase Console → Firestore Database → Rules →
**Publish**. Tanpa itu, siapa pun yang login bisa mengubah poin dan harga hadiah
langsung dari klien.

Ringkasnya: warga hanya boleh membuat pengajuan miliknya sendiri, **mengurangi**
poinnya sendiri saat menukar hadiah, dan menandai satu voucher jadi terpakai.
Menambah poin hanya bisa lewat server (Admin SDK).

---

## Catatan

- Angka beban dan ketersediaan PLTD berasal dari skenario tim ML, bukan telemetri
  meteran sungguhan.
- Foto bukti disimpan sebagai Base64 di dalam dokumen Firestore (batas 1 MiB per
  dokumen) — aplikasi mobile mengompres sebelum mengirim.
- Konstanta kalkulator BBM ada di `src/lib/fuel.ts`.
