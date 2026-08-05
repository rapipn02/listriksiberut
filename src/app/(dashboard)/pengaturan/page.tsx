"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { usePowerForecasts } from "@/hooks/usePowerForecasts";
import { FUEL } from "@/lib/fuel";
import { idr } from "@/lib/format";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function PengaturanPage() {
  const { session } = useAuth();
  const { status } = useSystemStatus();
  const { points } = usePowerForecasts();
  const [cek, setCek] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const updatedAt = status?.updated_at?.toDate?.();
  const umurJam = updatedAt
    ? Math.floor((Date.now() - updatedAt.getTime()) / 3600_000)
    : null;

  async function cekLayananML() {
    setBusy(true);
    setCek(null);
    try {
      const res = await fetch("/api/forecast/refresh", { method: "POST" });
      const data = await res.json();
      setCek(
        data.ok
          ? { ok: true, text: "Layanan prediksi merespons — data diperbarui." }
          : { ok: false, text: data.error ?? "Layanan tidak merespons." },
      );
    } catch {
      setCek({ ok: false, text: "Tidak dapat menghubungi layanan prediksi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan</h1>
        <p className="text-slate-500 mt-1">
          Profil operator, status sistem, dan parameter perhitungan.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold mb-4">Profil Operator</h3>
          <dl className="space-y-3 text-sm">
            <Baris label="Nama" nilai={session?.nama ?? "-"} />
            <Baris label="Email" nilai={session?.email ?? "-"} />
            <Baris
              label="Peran"
              nilai={
                session?.role === "admin_bumdes"
                  ? "Admin BUMDes — akses penuh"
                  : "Teknisi PLTD — tanpa manajemen poin"
              }
            />
            <Baris
              label="Mode data"
              nilai={
                isFirebaseConfigured
                  ? "Firebase (langsung)"
                  : "belum dikonfigurasi"
              }
            />
          </dl>
          <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
            Penambahan atau perubahan akun operator dilakukan melalui skrip
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded">
              npm run seed
            </code>
            oleh pengelola sistem.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold mb-4">Status Sistem</h3>
          <dl className="space-y-3 text-sm">
            <Baris
              label="Versi model AI"
              nilai={status?.model_version ?? "belum tersedia"}
            />
            <Baris
              label="Sinkronisasi terakhir"
              nilai={
                updatedAt
                  ? `${updatedAt.toLocaleString("id-ID")} (${umurJam} jam lalu)`
                  : "-"
              }
            />
            <Baris
              label="Data prediksi termuat"
              nilai={`${points.length} jam ke depan`}
            />
            <Baris
              label="Kapasitas terpasang"
              nilai={`PLTS ${status?.total_plts_capacity_kw ?? "-"} kWp · PLTD ${
                status?.total_pltd_capacity_kw ?? "-"
              } kW`}
            />
            <Baris
              label="Dasar status"
              nilai={
                status?.status_basis === "worst_status_in_forecast_horizon"
                  ? "Kondisi terburuk dalam 48 jam"
                  : (status?.status_basis ?? "-")
              }
            />
          </dl>

          <button
            onClick={cekLayananML}
            disabled={busy}
            className="mt-4 w-full py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 disabled:opacity-60 font-semibold text-sm"
          >
            {busy ? "Menghubungi…" : "Uji Koneksi Layanan Prediksi"}
          </button>
          {cek && (
            <p
              className={`text-sm rounded-lg px-3 py-2 mt-3 ${
                cek.ok ? "text-brand-700 bg-brand-50" : "text-red-600 bg-red-50"
              }`}
            >
              {cek.text}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 xl:col-span-2">
          <h3 className="font-semibold">Parameter Perhitungan BBM</h3>
          <p className="text-xs text-slate-500 mb-4">
            Dipakai halaman Kalkulator BBM. Nilai tetap; ubah di berkas
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded">
              src/lib/fuel.ts
            </code>
            bila asumsi berubah.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kotak
              label="Harga solar"
              nilai={`${idr(FUEL.hargaSolarPerLiter)}/L`}
            />
            <Kotak label="Emisi CO₂" nilai={`${FUEL.co2PerLiter} kg/L`} />
            <Kotak
              label="Serapan 1 pohon"
              nilai={`${FUEL.co2SerapPohonPerHari} kg/hari`}
            />
            <Kotak
              label="Potensi maks."
              nilai={`${FUEL.literPenuhPerHari} L/hari`}
            />
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-4">
            Catatan: angka beban dan ketersediaan PLTD adalah asumsi skenario
            dari tim ML, bukan telemetri meteran sesungguhnya.
          </p>
        </div>
      </div>
    </div>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-2 last:border-0">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="font-medium text-right break-all">{nilai}</dd>
    </div>
  );
}

function Kotak({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold mt-0.5">{nilai}</p>
    </div>
  );
}
