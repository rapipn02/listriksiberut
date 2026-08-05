"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRewards, useRedemptionHistory } from "@/hooks/useRewards";

const STATUS_PILL: Record<string, string> = {
  Aktif: "text-brand-700 bg-brand-50",
  Baru: "text-amber-700 bg-amber-50",
  Pending: "text-orange-700 bg-orange-50",
  Nonaktif: "text-slate-500 bg-slate-100",
};

const AVATAR_BG = [
  "bg-brand-600",
  "bg-blue-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-slate-400",
];

function initials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function PoinPage() {
  const { session } = useAuth();
  const { rewards, addReward } = useRewards();
  const { items: riwayat } = useRedemptionHistory(10);
  const [toast, setToast] = useState<string | null>(null);

  if (session && session.role !== "admin_bumdes") {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold">Akses ditolak</h2>
        <p className="text-slate-500 mt-1">
          Menu Manajemen Poin hanya untuk Admin BUMDes.
        </p>
      </div>
    );
  }

  async function handleTambahWarga() {
    const nama = window.prompt("Nama warga baru:");
    if (!nama) return;
    const hp = window.prompt("Nomor HP:") ?? "-";
    try {
      await addReward(nama, hp);
      setToast(`Warga ditambahkan: ${nama}`);
    } catch {
      setToast("Gagal menambah warga.");
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Poin BUMDes</h1>
          <p className="text-slate-500 mt-1">
            Peringkat poin warga & persetujuan penukaran hadiah.
          </p>
        </div>
        <button
          onClick={handleTambahWarga}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
        >
          + Tambah Warga
        </button>
      </div>

      {toast && (
        <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2 mb-4">
          {toast}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="rounded-xl bg-white border border-slate-200 p-5 xl:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Peringkat Poin Warga</h3>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-0.5">
              {rewards.length} warga
            </span>
          </div>

          <div className="-mx-5 px-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[36rem]">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                <th className="text-left font-semibold py-2">#</th>
                <th className="text-left font-semibold">WARGA</th>
                <th className="text-right font-semibold">NO. HP</th>
                <th className="text-right font-semibold">POIN</th>
                <th className="text-right font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((w, i) => (
                <tr key={w.id} className="border-b border-slate-50">
                  <td className="py-3 text-slate-400">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          AVATAR_BG[i % AVATAR_BG.length]
                        } text-white flex items-center justify-center text-xs font-semibold`}
                      >
                        {initials(w.nama_warga)}
                      </div>
                      <span className="font-medium">{w.nama_warga}</span>
                    </div>
                  </td>
                  <td className="text-right text-slate-500 font-mono text-xs">
                    {w.nomor_hp}
                  </td>
                  <td className="text-right font-bold">{w.total_poin}</td>
                  <td className="text-right">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        STATUS_PILL[w.status ?? "Aktif"]
                      }`}
                    >
                      {w.status ?? "Aktif"}
                    </span>
                  </td>
                </tr>
              ))}
              {rewards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada warga terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 min-w-0">
          <h3 className="font-semibold">Penukaran Terakhir</h3>
          <p className="text-xs text-slate-500 mb-4">
            Warga menukar sendiri lewat aplikasi — kode langsung diterima tanpa
            persetujuan operator.
          </p>
          <div className="space-y-3">
            {riwayat.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="border border-slate-200 rounded-xl p-3 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                  {initials(r.nama_warga || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {r.nama_warga || "Warga"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {r.nama_hadiah}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-red-600">-{r.biaya_poin}</p>
                  <p className="text-[10px] text-slate-400 -mt-0.5">poin</p>
                </div>
              </div>
            ))}
            {riwayat.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                Belum ada penukaran.
              </p>
            )}
          </div>
          <Link
            href="/hadiah"
            className="mt-4 block text-center py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 font-semibold text-sm"
          >
            Kelola Hadiah & Stok
          </Link>
        </div>
      </div>
    </div>
  );
}
