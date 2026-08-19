"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { STATUS_GRID } from "@/lib/gridStatus";

const LANGKAH = [
  {
    n: 1,
    judul: "Pantau status grid",
    isi: "Buka Dashboard. Kartu hijau kiri menunjukkan Kondisi Saat Ini, kartu di sebelahnya menunjukkan Risiko 48 Jam. Kalau Risiko 48 Jam berwarna merah (ALERT DEFISIT), artinya dalam dua hari ke depan beban akan melampaui pasokan.",
  },
  {
    n: 2,
    judul: "Baca Jam Emas AI",
    isi: "Kartu Jam Emas menunjukkan rentang waktu saat produksi surya melebihi beban. Itu waktu terbaik warga memakai listrik berdaya besar — pompa air, setrika, mesin pendingin es — karena tenaganya gratis dari matahari.",
  },
  {
    n: 3,
    judul: "Kirim imbauan ke warga",
    isi: "Masuk menu Notifikasi. Tekan 'Isi Pesan Jam Emas' untuk mengisi otomatis, atau tulis pesan sendiri. Tekan Kirim Broadcast Alert — pesan langsung masuk ke HP warga yang memasang aplikasi ListrikSiberut.",
  },
  {
    n: 4,
    judul: "Berikan poin partisipasi",
    isi: "Warga yang menggeser jam pemakaian mendapat poin BUMDes. Besaran poin diatur di halaman Notifikasi. Poin bisa ditukar voucher air desa, sembako, atau token listrik.",
  },
  {
    n: 5,
    judul: "Setujui penukaran hadiah",
    isi: "Di menu Manajemen Poin, panel kanan berisi permintaan penukaran yang menunggu. Tekan Setujui bila warga sudah datang ke kantor BUMDes — poinnya otomatis berkurang sesuai nilai hadiah.",
  },
];

export default function BantuanPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin_bumdes";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Panduan Load Shifting</h1>
        <p className="text-slate-500 mt-1">
          Cara memakai dashboard untuk memindahkan beban listrik warga saat
          pasokan menipis.
        </p>
      </div>

      <div className="rounded-xl p-5 text-white bg-gradient-to-br from-slate-800 to-brand-900 mb-4">
        <h2 className="text-xl font-bold">Apa itu load shifting?</h2>
        <p className="text-sm text-slate-200 mt-2 leading-relaxed">
          Listrik Siberut berasal dari panel surya (PLTS 75 kWp) dan genset
          diesel (PLTD). Siang hari surya melimpah, tapi malam hari surya nol
          sementara pemakaian warga justru memuncak — di situlah genset terpaksa
          menyala dan solar terbakar.
        </p>
        <p className="text-sm text-slate-200 mt-3 leading-relaxed">
          <b className="text-white">Load shifting</b> berarti mengajak warga
          menggeser pemakaian alat berdaya besar dari malam ke siang. Beban
          malam turun, genset lebih jarang menyala, solar hemat, dan risiko
          padam berkurang. AI di sistem ini memperkirakan kapan defisit akan
          terjadi supaya imbauan bisa dikirim sebelum, bukan sesudah.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 mb-4">
        <h3 className="font-semibold mb-4">Alur kerja harian operator</h3>
        <ol className="space-y-4">
          {LANGKAH.filter((l) => isAdmin || l.n !== 5).map((l) => (
            <li key={l.n} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                {l.n}
              </span>
              <div>
                <p className="font-semibold text-sm">{l.judul}</p>
                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                  {l.isi}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold mb-3">Arti warna status</h3>
          <div className="space-y-3 text-sm">
            {(["NORMAL", "WARNING", "ALERT"] as const).map((k) => (
              <Status
                key={k}
                warna={STATUS_GRID[k].titik}
                nama={STATUS_GRID[k].label}
                arti={`${STATUS_GRID[k].kondisi} ${STATUS_GRID[k].pesan}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold mb-3">Pertanyaan umum</h3>
          <div className="space-y-3 text-sm">
            <Faq
              t="Kenapa ada dua badge status?"
              j="Kondisi Saat Ini menggambarkan jam berjalan. Risiko 48 Jam menggambarkan kondisi terburuk yang diperkirakan dalam dua hari ke depan — bisa merah walaupun sekarang masih aman."
            />
            <Faq
              t="Data prediksi diperbarui berapa lama?"
              j="Otomatis setiap 3 jam. Bila perlu segera, tekan tombol Perbarui Prediksi di Dashboard."
            />
            <Faq
              t="Muncul tulisan 'Data belum diperbarui'?"
              j="Artinya sinkronisasi terakhir lebih dari 2 jam lalu. Coba Perbarui Prediksi; bila tetap gagal, hubungi pengelola server."
            />
            <Faq
              t="Broadcast tidak sampai ke HP warga?"
              j="Pastikan warga sudah memasang aplikasi ListrikSiberut dan mengizinkan notifikasi."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 mt-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-sm">Siap mulai?</p>
          <p className="text-xs text-slate-500">
            Kembali ke Dashboard untuk memeriksa kondisi grid saat ini.
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
        >
          Buka Dashboard
        </Link>
      </div>
    </div>
  );
}

function Status({
  warna,
  nama,
  arti,
}: {
  warna: string;
  nama: string;
  arti: string;
}) {
  return (
    <div className="flex gap-3">
      <span className={`shrink-0 w-3 h-3 rounded-full mt-1 ${warna}`} />
      <div>
        <p className="font-semibold">{nama}</p>
        <p className="text-slate-600">{arti}</p>
      </div>
    </div>
  );
}

function Faq({ t, j }: { t: string; j: string }) {
  return (
    <div className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <p className="font-medium">{t}</p>
      <p className="text-slate-600 mt-0.5">{j}</p>
    </div>
  );
}
