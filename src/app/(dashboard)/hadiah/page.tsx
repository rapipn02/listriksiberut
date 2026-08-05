"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  useRewardCatalog,
  useVouchers,
  useRedemptionHistory,
} from "@/hooks/useRewards";
import {
  tambahHadiah,
  ubahAktifHadiah,
  tambahVoucherMassal,
} from "@/lib/rewardActions";
import { waktuRelatif } from "@/hooks/useBroadcasts";
import { num } from "@/lib/format";
import type { RewardIcon } from "@/lib/types";

const IKON: Record<RewardIcon, string> = {
  FLASH: "⚡",
  WATER: "💧",
  SHOPPING: "🛒",
};

export default function HadiahPage() {
  const { session } = useAuth();
  const { items: katalog } = useRewardCatalog();
  const { stok } = useVouchers();
  const { items: riwayat } = useRedemptionHistory();

  const [pilih, setPilih] = useState("");
  const [teksKode, setTeksKode] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  if (session && session.role !== "admin_bumdes") {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold">Akses ditolak</h2>
        <p className="text-slate-500 mt-1">
          Halaman Hadiah hanya untuk Admin BUMDes.
        </p>
      </div>
    );
  }

  async function simpanKode() {
    const catalogId = pilih || katalog[0]?.id;
    if (!catalogId) {
      setToast({ ok: false, text: "Belum ada hadiah di katalog." });
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const jumlah = await tambahVoucherMassal(catalogId, teksKode);
      if (jumlah === 0) {
        setToast({ ok: false, text: "Tidak ada kode yang bisa disimpan." });
      } else {
        setToast({ ok: true, text: `${jumlah} kode ditambahkan ke stok.` });
        setTeksKode("");
      }
    } catch {
      setToast({ ok: false, text: "Gagal menyimpan kode." });
    } finally {
      setBusy(false);
    }
  }

  async function hadiahBaru() {
    const name = window.prompt("Nama hadiah:");
    if (!name) return;
    const poin = Number(window.prompt("Biaya poin:") ?? "0");
    if (!Number.isFinite(poin) || poin <= 0) {
      setToast({ ok: false, text: "Biaya poin harus angka lebih dari 0." });
      return;
    }
    const ikon = (
      window.prompt("Ikon — FLASH (listrik), WATER (air), SHOPPING (sembako):", "FLASH") ??
      "FLASH"
    )
      .trim()
      .toUpperCase();
    try {
      await tambahHadiah({
        name,
        pointsRequired: poin,
        iconType: (["FLASH", "WATER", "SHOPPING"].includes(ikon)
          ? ikon
          : "FLASH") as RewardIcon,
        type: "DIGITAL",
        deskripsi: window.prompt("Deskripsi singkat:") ?? "",
        aktif: true,
      });
      setToast({ ok: true, text: `Hadiah ditambahkan: ${name}` });
    } catch {
      setToast({ ok: false, text: "Gagal menambah hadiah." });
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Hadiah & Stok Voucher</h1>
          <p className="text-slate-500 mt-1">
            Warga menukar poin lewat aplikasi dan langsung menerima kode — tanpa
            datang ke kantor BUMDes.
          </p>
        </div>
        <button
          onClick={hadiahBaru}
          className="px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
        >
          + Tambah Hadiah
        </button>
      </div>

      {toast && (
        <p
          className={`text-sm rounded-lg px-3 py-2 mb-4 ${
            toast.ok ? "text-brand-700 bg-brand-50" : "text-red-600 bg-red-50"
          }`}
        >
          {toast.text}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* katalog */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 xl:col-span-2 min-w-0">
          <h3 className="font-semibold mb-4">Katalog Hadiah</h3>
          {katalog.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Belum ada hadiah. Tekan “Tambah Hadiah”.
            </p>
          ) : (
            <div className="space-y-3">
              {katalog.map((h) => {
                const s = stok[h.id] ?? { tersedia: 0, terpakai: 0 };
                const aktif = h.aktif !== false;
                const habis = s.tersedia === 0;
                return (
                  <div
                    key={h.id}
                    className="border border-slate-200 rounded-xl p-3 flex items-start gap-3 flex-wrap"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
                      {IKON[h.iconType] ?? "🎁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{h.name}</p>
                        {!aktif && (
                          <span className="text-[11px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                            Nonaktif
                          </span>
                        )}
                        {habis && aktif && (
                          <span className="text-[11px] text-red-700 bg-red-50 rounded-full px-2 py-0.5">
                            Stok habis
                          </span>
                        )}
                      </div>
                      {h.deskripsi && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {h.deskripsi}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        <b className="text-brand-700">
                          {num(h.pointsRequired)} poin
                        </b>
                        {" · "}
                        {s.tersedia} kode tersedia · {s.terpakai} terpakai
                      </p>
                    </div>
                    <button
                      onClick={() => ubahAktifHadiah(h.id, !aktif)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold shrink-0"
                    >
                      {aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* input stok */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 min-w-0">
          <h3 className="font-semibold">Tambah Kode Voucher</h3>
          <p className="text-xs text-slate-500 mb-4">
            Tempel kode token PLN atau voucher — satu kode per baris.
          </p>

          <label className="text-sm font-medium">Untuk hadiah</label>
          <select
            value={pilih || katalog[0]?.id || ""}
            onChange={(e) => setPilih(e.target.value)}
            className="w-full mt-1 mb-3 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {katalog.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <label className="text-sm font-medium">Daftar kode</label>
          <textarea
            rows={6}
            value={teksKode}
            onChange={(e) => setTeksKode(e.target.value)}
            placeholder={"1234-5678-9012-3456\n2345-6789-0123-4567"}
            className="w-full mt-1 mb-1 px-3 py-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-500 mb-3">
            {teksKode.split(/\r?\n/).filter((k) => k.trim()).length} kode siap
            disimpan
          </p>
          <button
            onClick={simpanKode}
            disabled={busy}
            className="w-full py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm"
          >
            {busy ? "Menyimpan…" : "Simpan ke Stok"}
          </button>
        </div>
      </div>

      {/* riwayat penukaran */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 mt-4 min-w-0">
        <h3 className="font-semibold mb-4">Riwayat Penukaran</h3>
        {riwayat.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Belum ada penukaran.
          </p>
        ) : (
          <div className="-mx-5 px-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[34rem]">
              <thead>
                <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                  <th className="text-left font-semibold py-2">WARGA</th>
                  <th className="text-left font-semibold">HADIAH</th>
                  <th className="text-left font-semibold">KODE</th>
                  <th className="text-right font-semibold">POIN</th>
                  <th className="text-right font-semibold">WAKTU</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium">{r.nama_warga || "—"}</td>
                    <td>{r.nama_hadiah}</td>
                    <td className="font-mono text-xs text-slate-500">
                      {r.kode_diberikan}
                    </td>
                    <td className="text-right font-bold">-{r.biaya_poin}</td>
                    <td className="text-right text-xs text-slate-500">
                      {r.timestamp?.toDate ? waktuRelatif(r.timestamp.toDate()) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
