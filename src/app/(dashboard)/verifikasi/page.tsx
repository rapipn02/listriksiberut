"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BuktiFoto } from "@/components/BuktiFoto";
import { useParticipations } from "@/hooks/useParticipations";
import { waktuRelatif } from "@/hooks/useBroadcasts";
import { putuskanPartisipasi } from "@/lib/rewardActions";
import { totalUkuranKb } from "@/lib/photo";
import { Refresh } from "@/components/icons";
import type { ParticipationStatus } from "@/lib/types";

const POIN_MANUAL = 25;

const STATUS_META: Record<
  ParticipationStatus,
  { label: string; pill: string }
> = {
  PENDING: {
    label: "Dianalisis AI",
    pill: "text-amber-700 bg-amber-50 border-amber-200",
  },
  APPROVED: {
    label: "Poin Diterima",
    pill: "text-brand-700 bg-brand-50 border-brand-200",
  },
  REJECTED: {
    label: "Ditolak",
    pill: "text-red-700 bg-red-50 border-red-200",
  },
};

export default function VerifikasiPage() {
  const { session } = useAuth();
  const { items, menunggu, disetujui, ditolak } = useParticipations();
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  async function putuskan(
    id: string,
    userId: string,
    setujui: boolean,
    nama: string,
  ) {
    setBusyId(id);
    setToast(null);
    try {
      await putuskanPartisipasi(
        id,
        userId,
        setujui,
        POIN_MANUAL,
        session?.nama ?? "operator",
      );
      setToast({
        ok: true,
        text: setujui
          ? `Disetujui manual: ${nama} (+${POIN_MANUAL} poin)`
          : `Ditolak manual: ${nama}`,
      });
    } catch {
      setToast({ ok: false, text: "Gagal menyimpan keputusan." });
    } finally {
      setBusyId(null);
    }
  }

  if (session && session.role !== "admin_bumdes") {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold">Akses ditolak</h2>
        <p className="text-slate-500 mt-1">
          Halaman Verifikasi hanya untuk Admin BUMDes.
        </p>
      </div>
    );
  }

  async function jalankanVerifikasi() {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch("/api/verify-participation", {
        method: "POST",
        headers: { "x-from-dashboard": "1" },
      });
      const d = await res.json();
      setToast(
        d.ok
          ? {
              ok: true,
              text:
                d.diproses === 0
                  ? "Tidak ada pengajuan menunggu."
                  : `${d.diproses} diproses — ${d.disetujui} disetujui, ${d.ditolak} ditolak.`,
            }
          : { ok: false, text: d.error ?? "Gagal menjalankan verifikasi." },
      );
    } catch {
      setToast({ ok: false, text: "Gagal menghubungi mesin verifikasi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Verifikasi Partisipasi</h1>
          <p className="text-slate-500 mt-1">
            Bukti foto warga dinilai otomatis oleh mesin aturan — operator tidak
            perlu menyetujui manual.
          </p>
        </div>
        <button
          onClick={jalankanVerifikasi}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm"
        >
          <Refresh className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Memproses…" : "Jalankan Verifikasi Sekarang"}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Ringkas label="Menunggu Analisis" nilai={menunggu} warna="text-amber-600" />
        <Ringkas label="Poin Diterima" nilai={disetujui} warna="text-brand-600" />
        <Ringkas label="Ditolak" nilai={ditolak} warna="text-red-600" />
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 mb-6">
        <h3 className="font-semibold mb-2">Cara mesin menilai</h3>
        <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
          <li>Waktu kirim harus berada dalam jendela imbauan yang aktif.</li>
          <li>Warga belum pernah menerima poin di jendela yang sama.</li>
          <li>Foto bukti ada dan waktunya masuk akal.</li>
        </ol>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
          Penilaian memakai aturan, bukan pencocokan penurunan beban sungguhan —
          sistem belum memiliki telemetri meteran. Setiap keputusan dicatat
          alasannya agar bisa ditelusuri.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 min-w-0">
        <h3 className="font-semibold mb-4">Riwayat Pengajuan</h3>

        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            Belum ada pengajuan dari warga.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <div
                  key={p.id}
                  className="flex gap-3 border border-slate-200 rounded-xl p-3"
                >

                  <BuktiFoto foto={p.photosBase64} nama={p.userName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{p.userName}</p>
                      <span
                        className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${meta.pill}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.timestamp?.toDate ? waktuRelatif(p.timestamp.toDate()) : "-"}
                      {p.goldenHourRange ? ` · klaim ${p.goldenHourRange}` : ""}
                      {p.poinDiberikan ? ` · +${p.poinDiberikan} poin` : ""}
                      {` · ${p.photosBase64?.length ?? 0} foto`}
                      {(p.photosBase64?.length ?? 0) > 0
                        ? ` (${totalUkuranKb(p.photosBase64)} KB)`
                        : ""}
                    </p>
                    {p.verificationReason && (
                      <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded px-2 py-1">
                        {p.verificationReason}
                      </p>
                    )}

                    <div className="flex gap-2 mt-2">
                      {p.status !== "APPROVED" && (
                        <button
                          onClick={() => putuskan(p.id, p.userId, true, p.userName)}
                          disabled={busyId === p.id}
                          className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold"
                        >
                          Setujui manual
                        </button>
                      )}
                      {p.status !== "REJECTED" && (
                        <button
                          onClick={() => putuskan(p.id, p.userId, false, p.userName)}
                          disabled={busyId === p.id}
                          className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-xs font-semibold"
                        >
                          Tolak manual
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Ringkas({
  label,
  nilai,
  warna,
}: {
  label: string;
  nilai: number;
  warna: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-extrabold mt-1 ${warna}`}>{nilai}</p>
    </div>
  );
}
