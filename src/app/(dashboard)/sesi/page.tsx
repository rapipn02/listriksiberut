"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSessions } from "@/hooks/useSessions";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { persenPartisipasi, persenTeks, totalKk } from "@/lib/desa";
import {
  buatSesi,
  ubahStatusSesi,
  hapusSesi,
  formatTanggalId,
} from "@/lib/sessionActions";
import { Refresh, Users } from "@/components/icons";
import type { SessionStatus } from "@/lib/types";

const STATUS_META: Record<SessionStatus, { label: string; pill: string }> = {
  UPCOMING: {
    label: "Akan Datang",
    pill: "text-slate-600 bg-slate-100 border-slate-200",
  },
  ACTIVE: {
    label: "Sedang Berjalan",
    pill: "text-brand-700 bg-brand-50 border-brand-300",
  },
  ENDED: {
    label: "Selesai",
    pill: "text-slate-500 bg-slate-50 border-slate-200",
  },
};

function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function SesiPage() {
  const { session } = useAuth();
  const { items, aktif } = useSessions();
  const { status } = useSystemStatus();
  const kk = totalKk(status);

  const [tanggal, setTanggal] = useState(hariIni());
  const [mulai, setMulai] = useState("10:00");
  const [selesai, setSelesai] = useState("15:00");
  const [target, setTarget] = useState("30");
  const [kapasitas, setKapasitas] = useState("50");
  const [poin, setPoin] = useState("25");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  if (session && session.role !== "admin_bumdes") {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold">Akses ditolak</h2>
        <p className="text-slate-500 mt-1">
          Pengelolaan sesi hanya untuk Admin BUMDes.
        </p>
      </div>
    );
  }

  async function simpan() {
    if (mulai >= selesai) {
      setToast({ ok: false, text: "Jam selesai harus setelah jam mulai." });
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const [y, m, d] = tanggal.split("-").map(Number);
      await buatSesi(
        {
          tanggal: new Date(y, m - 1, d),
          startTime: mulai,
          endTime: selesai,
          targetSavingKwh: Number(target) || 0,
          capacityKw: Number(kapasitas) || 0,
          poinPerPartisipasi: Number(poin) || 25,
        },
        session?.uid ?? "operator",
      );
      setToast({ ok: true, text: "Sesi dibuat." });
    } catch {
      setToast({ ok: false, text: "Gagal membuat sesi." });
    } finally {
      setBusy(false);
    }
  }

  async function sinkronkan() {
    setBusy(true);
    try {
      const r = await fetch("/api/sessions/tick", {
        method: "POST",
        headers: { "x-from-dashboard": "1" },
      });
      const d = await r.json();
      setToast(
        d.ok
          ? {
              ok: true,
              text: `${d.diperbarui} sesi diperbarui (${d.jadi_aktif} jadi aktif, ${d.jadi_selesai} selesai).`,
            }
          : { ok: false, text: d.error ?? "Gagal menyinkronkan." },
      );
    } catch {
      setToast({ ok: false, text: "Gagal menghubungi server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sesi Jam Emas</h1>
          <p className="text-slate-500 mt-1">
            Jadwal load shifting warga. Tombol kirim bukti di HP warga menyala
            saat ada sesi berstatus <b>Sedang Berjalan</b>.
          </p>
        </div>
        <button
          onClick={sinkronkan}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 disabled:opacity-60 font-semibold text-sm"
        >
          <Refresh className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          Sinkronkan Status
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

      <div
        className={`rounded-xl p-5 mb-6 ${
          aktif.length > 0
            ? "text-white bg-gradient-to-br from-brand-600 to-brand-800"
            : "bg-white border border-slate-200"
        }`}
      >
        {aktif.length > 0 ? (
          <>
            <p className="text-sm text-white/90">Sesi Sedang Berjalan</p>
            <p className="text-2xl font-extrabold mt-1">
              {aktif[0].startTime} – {aktif[0].endTime}
            </p>
            <p className="text-sm text-white/90 mt-1">
              beban {aktif[0].currentLoadKw} kW dari {aktif[0].capacityKw} kW ·
              target pengalihan {aktif[0].targetSavingKwh} kWh
            </p>
            <div className="mt-3 max-w-sm">
              <div className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Users className="w-4 h-4" />
                  <b className="text-white">
                    {aktif[0].participantCount}/{kk}
                  </b>{" "}
                  KK asumsi berpartisipasi
                </span>
                <span className="font-bold">
                  {persenTeks(persenPartisipasi(aktif[0].participantCount, kk))}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/25 mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: `${Math.min(
                      100,
                      persenPartisipasi(aktif[0].participantCount, kk),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold">Tidak ada sesi berjalan</p>
            <p className="text-sm text-slate-500 mt-1">
              Warga belum bisa mengirim bukti partisipasi. Buat sesi baru di
              bawah, atau tunggu sistem membuatnya otomatis saat beban
              mendekati batas PLTD.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="rounded-xl bg-white border border-slate-200 p-5 min-w-0">
          <h3 className="font-semibold mb-4">Jadwalkan Sesi</h3>
          <div className="space-y-3 text-sm">
            <Isian label="Tanggal">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </Isian>
            <div className="grid grid-cols-2 gap-3">
              <Isian label="Mulai">
                <input
                  type="time"
                  value={mulai}
                  onChange={(e) => setMulai(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Isian>
              <Isian label="Selesai">
                <input
                  type="time"
                  value={selesai}
                  onChange={(e) => setSelesai(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Isian>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Isian label="Target pengalihan (kWh)">
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Isian>
              <Isian label="Kapasitas PLTS (kW)">
                <input
                  type="number"
                  value={kapasitas}
                  onChange={(e) => setKapasitas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </Isian>
            </div>
            <Isian label="Poin per partisipasi">
              <input
                type="number"
                value={poin}
                onChange={(e) => setPoin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </Isian>
          </div>
          <button
            onClick={simpan}
            disabled={busy}
            className="mt-4 w-full py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm"
          >
            {busy ? "Menyimpan…" : "Buat Sesi"}
          </button>
          <p className="text-xs text-slate-500 mt-3">
            Status akan berpindah sendiri: Akan Datang → Sedang Berjalan →
            Selesai, diperiksa tiap 5 menit.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 xl:col-span-2 min-w-0">
          <h3 className="font-semibold mb-4">Daftar Sesi</h3>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">
              Belum ada sesi terjadwal.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((s) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.UPCOMING;
                return (
                  <div
                    key={s.id}
                    className={`border rounded-xl p-3 flex items-start gap-3 flex-wrap ${
                      s.status === "ACTIVE"
                        ? "border-brand-400 bg-brand-50/70"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {s.startTime} – {s.endTime}
                        </p>
                        <span
                          className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                        {s.dibuat_oleh === "sistem" && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                            otomatis
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{s.date}</p>
                      <p className="text-xs font-medium text-slate-700 mt-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {s.participantCount}/{kk} KK berpartisipasi (
                        {persenTeks(persenPartisipasi(s.participantCount, kk))}%)
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        beban {s.currentLoadKw} / {s.capacityKw} kW (kapasitas
                        PLTS) · target pengalihan {s.targetSavingKwh} kWh
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {s.status === "UPCOMING" && (
                        <button
                          onClick={() => ubahStatusSesi(s.id, "ACTIVE")}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
                        >
                          Aktifkan
                        </button>
                      )}
                      {s.status === "ACTIVE" && (
                        <button
                          onClick={() => ubahStatusSesi(s.id, "ENDED")}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold"
                        >
                          Akhiri
                        </button>
                      )}
                      <button
                        onClick={() => hapusSesi(s.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-red-50 hover:text-red-600 text-sm font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Contoh format tanggal yang dikirim ke aplikasi:{" "}
        <code className="px-1.5 py-0.5 bg-slate-100 rounded">
          {formatTanggalId(new Date())}
        </code>
      </p>
    </div>
  );
}

function Isian({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
