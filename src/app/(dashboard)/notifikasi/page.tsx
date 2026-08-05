"use client";

import { useState } from "react";
import { demoBroadcastHistory } from "@/lib/demoData";
import { saveInsentifPoin } from "@/lib/rewardActions";
import { isFirebaseConfigured } from "@/lib/firebase";
import { usePowerForecasts } from "@/hooks/usePowerForecasts";
import { findGreenWindow } from "@/lib/greenHours";
import { Send } from "@/components/icons";

export default function NotifikasiPage() {
  const { points } = usePowerForecasts();
  const green = findGreenWindow(points);
  const [title, setTitle] = useState("Peringatan Defisit Listrik Malam Ini");
  const [message, setMessage] = useState(
    "Mohon kurangi pemakaian AC & alat berat pukul 18.00–21.00. Berhemat = dapat poin BUMDes yang bisa ditukar hadiah!",
  );
  const [poin, setPoin] = useState("25");
  const [busy, setBusy] = useState(false);
  const [savingPoin, setSavingPoin] = useState(false);
  const [poinToast, setPoinToast] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  async function simpanPoin() {
    const n = Number(poin);
    if (!Number.isFinite(n) || n <= 0) {
      setPoinToast("Poin harus angka > 0.");
      return;
    }
    setSavingPoin(true);
    setPoinToast("");
    try {
      if (isFirebaseConfigured) {
        await saveInsentifPoin(n);
      }
      setPoinToast(`Tersimpan: ${n} poin per partisipasi.`);
    } catch {
      setPoinToast("Gagal menyimpan.");
    } finally {
      setSavingPoin(false);
    }
  }

  async function kirim() {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setToast({
          ok: true,
          text:
            data.mode === "mock"
              ? "Broadcast tersimpan (mode demo, FCM belum aktif)."
              : "Broadcast terkirim ke warga.",
        });
      } else {
        setToast({ ok: false, text: data.error ?? "Gagal kirim." });
      }
    } catch {
      setToast({ ok: false, text: "Gagal kirim, coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Notifikasi & Broadcast</h1>
        <p className="text-slate-500 mt-1">
          Kirim peringatan ke warga saat defisit & atur insentif poin
          partisipasi.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-brand-200 p-4 flex items-center gap-4 flex-wrap mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
          ☀️
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-brand-600">
            JAM EMAS AI
          </p>
          <p className="font-semibold">
            {green
              ? `Surplus surya ${green.mulai}–${green.selesai} · anjurkan warga pakai listrik sekarang`
              : "Tidak ada surplus surya dalam prakiraan · imbau warga berhemat"}
          </p>
        </div>
        <button
          onClick={() => {
            if (!green) return;
            setTitle("Jam Emas Listrik Hari Ini");
            setMessage(
              `Surplus energi surya pukul ${green.mulai}–${green.selesai} (+${green.surplusKw} kW). ` +
                "Waktu terbaik menyalakan pompa air, setrika & peralatan berat. Gratis dari matahari!",
            );
          }}
          disabled={!green}
          className="px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm"
        >
          Isi Pesan Jam Emas
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold">Broadcast Alert</h3>
          <p className="text-xs text-slate-500 mb-4">
            Pesan dikirim via SMS & pengeras suara desa.
          </p>
          <label className="text-sm font-medium">Judul</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 mb-4 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <label className="text-sm font-medium">Pesan</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mt-1 mb-2 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-500 mb-4">
            Perkiraan penerima: <b>642 warga terdaftar</b>
          </p>
          <button
            onClick={kirim}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold"
          >
            <Send className="w-4 h-4" />
            {busy ? "Mengirim…" : "Kirim Broadcast Alert"}
          </button>
          {toast && (
            <p
              className={`text-sm rounded-lg px-3 py-2 mt-3 ${
                toast.ok
                  ? "text-brand-700 bg-brand-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {toast.text}
            </p>
          )}
        </div>

        <div className="space-y-4">

          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <h3 className="font-semibold">Poin Insentif Partisipasi</h3>
            <p className="text-xs text-slate-500 mb-4">
              Poin diberikan tiap warga mengikuti anjuran load shifting.
            </p>
            <label className="text-sm font-medium">Poin per partisipasi</label>
            <div className="flex gap-2 mt-1">
              <input
                value={poin}
                onChange={(e) => setPoin(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={simpanPoin}
                disabled={savingPoin}
                className="px-5 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                {savingPoin ? "…" : "Simpan"}
              </button>
            </div>
            {poinToast && (
              <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-1.5 mt-2">
                {poinToast}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
                ⚡ Rekomendasi AI: 25 poin
              </span>
              <span className="text-xs bg-brand-50 text-brand-700 rounded-full px-2.5 py-1">
                1 poin ≈ Rp 100
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <h3 className="font-semibold mb-3">Riwayat Broadcast</h3>
            <div className="space-y-3 text-sm">
              {demoBroadcastHistory.map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${b.bg} flex items-center justify-center`}
                  >
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.waktu}</p>
                  </div>
                  <span className="text-xs text-brand-700 bg-brand-50 rounded-full px-2 py-0.5">
                    Terkirim
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
