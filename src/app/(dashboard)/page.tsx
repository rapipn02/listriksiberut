"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { usePowerForecasts, useSolarWeekly } from "@/hooks/usePowerForecasts";
import { findGreenWindow } from "@/lib/greenHours";
import { tampilanStatus } from "@/lib/gridStatus";
import { persenPartisipasi, persenTeks, totalKk } from "@/lib/desa";
import { useSessions } from "@/hooks/useSessions";
import PowerBalanceChart from "@/components/PowerBalanceChart";
import KartuWaktuGrid from "@/components/Countdown";
import {
  Send,
  Download,
  Refresh,
  Users,
  AlertTriangle,
  ArrowUpRight,
} from "@/components/icons";
import type { ForecastPoint } from "@/lib/demoData";

function exportForecastCsv(points: ForecastPoint[]) {
  const header = "jam,beban_kw,plts_kw,defisit\n";
  const rows = points
    .map((p) => `${p.jam},${p.beban},${p.plts},${p.deficit ? "ya" : "tidak"}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `power-forecast-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STALE_AFTER_MS = 2 * 3600_000;

function cloudTag(persen: number) {
  if (persen >= 70) return { tag: "Tinggi", tagClass: "text-red-600 bg-red-50" };
  if (persen >= 40) return { tag: "Sedang", tagClass: "text-amber-600 bg-amber-50" };
  return { tag: "Rendah", tagClass: "text-brand-700 bg-brand-50" };
}

function ghiTag(wm2: number) {
  if (wm2 >= 500) return { tag: "Tinggi", tagClass: "text-brand-700 bg-brand-50" };
  if (wm2 >= 200) return { tag: "Sedang", tagClass: "text-amber-600 bg-amber-50" };
  return { tag: "Rendah", tagClass: "text-red-600 bg-red-50" };
}

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSystemStatus();
  const { points, weather } = usePowerForecasts();
  const { hari: produksiSurya } = useSolarWeekly();
  const { aktif } = useSessions();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const statusSistem = status?.current_status ?? "NORMAL";
  const statusJamIni =
    status?.current_operating_status ?? status?.current_status ?? "NORMAL";
  const meta = tampilanStatus(statusSistem);
  const jamIniMeta = tampilanStatus(statusJamIni);

  const plts = status?.total_plts_capacity_kw ?? 75;
  const pltd = status?.total_pltd_capacity_kw ?? 50;

  const bebanPuncak = points.length
    ? Math.round(Math.max(...points.map((p) => p.beban)))
    : 0;
  const maxSolar = Math.max(1, ...produksiSurya.map((d) => d.kwh));

  const green = findGreenWindow(points);
  const titikGrid = useMemo(
    () =>
      points
        .filter((p) => p.waktuMs)
        .map((p) => ({
          waktuMs: p.waktuMs as number,
          jam: p.jam,
          surplus: p.plts > p.beban,
        })),
    [points],
  );

  const kk = totalKk(status);
  const jamSekarang = points[0]?.jam ?? "";
  const sesiBerjalan = aktif[0];

  const updatedAt = status?.updated_at?.toDate?.();
  const isStale = updatedAt ? Date.now() - updatedAt.getTime() > STALE_AFTER_MS : false;

  async function refreshForecast() {
    setRefreshing(true);
    setToast(null);
    try {
      const res = await fetch("/api/forecast/refresh", { method: "POST" });
      const data = await res.json();
      setToast(
        data.ok
          ? { ok: true, text: "Prediksi diperbarui." }
          : { ok: false, text: data.error ?? "Gagal memperbarui prediksi." },
      );
    } catch {
      setToast({ ok: false, text: "Layanan prediksi tidak tersedia." });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            {isStale && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                ⚠ Data belum diperbarui
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            Pantau kesetimbangan daya pulau secara real-time & picu load
            shifting.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => router.push("/notifikasi")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
          >
            <Send className="w-4 h-4" />
            Broadcast Alert
          </button>
          <button
            onClick={refreshForecast}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 disabled:opacity-60 font-semibold text-sm"
          >
            <Refresh className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Memperbarui…" : "Perbarui Prediksi"}
          </button>
          <button
            onClick={() => exportForecastCsv(points)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor Data
          </button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div
          className={`rounded-xl p-5 bg-gradient-to-br ${meta.grad} ${meta.teks} flex flex-col justify-between min-h-[150px]`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-current opacity-90" />
              Status Sistem
            </span>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold leading-none">
              {meta.label}
            </div>
            <p className="text-xs mt-2 flex items-start gap-1 opacity-90">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              {meta.pesan}
            </p>
            <p className="text-[11px] mt-1 opacity-75">
              Status terburuk dalam prakiraan 48 jam · sama dengan yang dilihat
              warga di aplikasi
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between min-h-[150px]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Kondisi Jam Ini{jamSekarang ? ` · pukul ${jamSekarang}` : ""}
            </span>
            <span className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span
              className={`inline-block text-lg font-extrabold rounded-full px-3 py-1 ${jamIniMeta.pill}`}
            >
              {jamIniMeta.label}
            </span>
            <p className="text-xs text-slate-500 mt-2">{jamIniMeta.pesan}</p>
          </div>
        </div>

        <MetricCard
          label="Kapasitas PLTS"
          value={plts}
          unit="kWp"
          note="▲ Panel surya terpasang"
          noteClass="text-brand-600"
        />
        <MetricCard
          label="Prediksi Beban Puncak"
          value={bebanPuncak}
          unit="kW"
          note={`Batas aman PLTD ${pltd} kW`}
          noteClass={bebanPuncak > pltd ? "text-red-500" : "text-slate-500"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">

        <div className="rounded-xl bg-white border border-slate-200 p-5 xl:col-span-2 min-w-0">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
            <div>
              <h3 className="font-semibold">Kurva Kesetimbangan Daya</h3>
              <p className="text-xs text-slate-500">
                Prediksi 24 jam · Beban vs Surya vs Batas PLTD
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Legend color="bg-slate-800" text="Beban" />
              <Legend color="bg-brand-600" text="Prediksi PLTS" />
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-t border-dashed border-slate-400" />
                Batas PLTD
              </span>
            </div>
          </div>
          <PowerBalanceChart points={points} pltdLimit={pltd} />
          <p className="text-[11px] text-slate-400 mt-2">
            kW = daya sesaat · kWp = kapasitas terpasang panel
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col">
          <p className="text-[11px] font-semibold tracking-wide text-brand-600">
            ✳ JAM EMAS AI
          </p>
          <h3 className="text-xl font-bold mt-2 leading-snug">
            {green
              ? "Surplus surya diprediksi hari ini"
              : "Tidak ada surplus surya"}
          </h3>
          {green ? (
            <>
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-wider my-3">
                {green.mulai} – {green.selesai}
              </div>
              <p className="text-sm text-slate-500">
                Waktu ideal warga menyalakan pompa air, setrika & peralatan
                berat. Estimasi surplus{" "}
                <b className="text-slate-700">+{green.surplusKw} kW</b>.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 my-3">
              Prakiraan menunjukkan beban selalu melampaui produksi surya.
              Imbau warga berhemat sepanjang hari.
            </p>
          )}
          <div className="mt-auto pt-4 text-xs border-t border-slate-100">
            {sesiBerjalan ? (
              <>
                <p className="text-slate-500">
                  Partisipasi sesi {sesiBerjalan.startTime}–{sesiBerjalan.endTime}
                </p>
                <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  {sesiBerjalan.participantCount}/{kk} KK berpartisipasi (
                  {persenTeks(persenPartisipasi(sesiBerjalan.participantCount, kk))}%)
                </p>
              </>
            ) : (
              <p className="text-slate-500">
                Belum ada sesi berjalan · {kk} KK asumsi
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/notifikasi")}
            disabled={!green}
            className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm"
          >
            <Send className="w-4 h-4" />
            Kirim ke Warga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold">Cuaca Satelit</h3>
          <p className="text-xs text-slate-500 mb-4">
            Data pukul 09.00 WIB · Selat Mentawai
          </p>
          <div className="space-y-3">
            <WeatherRow
              icon="☁️"
              label="Tutupan Awan"
              value={Math.round(weather.cloud)}
              unit="%"
              {...cloudTag(weather.cloud)}
            />
            <WeatherRow
              icon="☀️"
              label="Radiasi GHI"
              value={Math.round(weather.ghi)}
              unit=" W/m²"
              {...ghiTag(weather.ghi)}
            />
            <WeatherRow
              icon="🌡️"
              label="Suhu Udara"
              value={Math.round(weather.suhu)}
              unit="°C"
              tag="Normal"
              tagClass="text-brand-700 bg-brand-50"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Produksi Surya</h3>
              <p className="text-xs text-slate-500">
              7 hari terakhir · kWh prediksi PLTS
            </p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-0.5">
              Mingguan
            </span>
          </div>
          {produksiSurya.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-14">
              Belum ada data prakiraan tersimpan.
            </p>
          ) : (
          <div className="flex items-end justify-between gap-2 h-40 mt-4">
            {produksiSurya.map((d) => (
              <div
                key={d.hari}
                className="flex-1 h-full flex flex-col items-center justify-end gap-1"
              >
                <div
                  className={`group relative w-full rounded ${
                    d.kwh === maxSolar ? "bg-brand-600" : "bg-brand-200"
                  }`}
                  style={{ height: `${(d.kwh / maxSolar) * 65}%` }}
                >
                  <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 z-10">
                    {d.kwh} kWh
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{d.hari}</span>
              </div>
            ))}
          </div>
          )}
        </div>

        <KartuWaktuGrid titik={titikGrid} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  note,
  noteClass,
}: {
  label: string;
  value: number;
  unit: string;
  note: string;
  noteClass: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col justify-between min-h-[150px]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-extrabold">
          {value}
          <span className="text-lg font-semibold text-slate-400 ml-1">
            {unit}
          </span>
        </div>
        <p className={`text-xs mt-1.5 ${noteClass}`}>{note}</p>
      </div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-0.5 ${color}`} />
      {text}
    </span>
  );
}

function WeatherRow({
  icon,
  label,
  value,
  unit,
  tag,
  tagClass,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  tag: string;
  tagClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold">
          {value}
          <span className="text-sm text-slate-400">{unit}</span>
        </p>
      </div>
      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${tagClass}`}>
        {tag}
      </span>
    </div>
  );
}
