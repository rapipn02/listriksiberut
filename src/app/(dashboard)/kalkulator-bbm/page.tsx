"use client";

import { useState } from "react";
import { FUEL, hitungHemat } from "@/lib/fuel";
import { num, idr } from "@/lib/format";

const PRESET = [20, 50, 80];

export default function KalkulatorPage() {
  const [kepatuhan, setKepatuhan] = useState(50);
  const h = hitungHemat(kepatuhan);
  const gaugeOffset = 314 * (1 - kepatuhan / 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Kalkulator BBM Solar</h1>
        <p className="text-slate-500 mt-1">
          Simulasikan penghematan solar PLTD berdasarkan kepatuhan warga
          melakukan load shifting.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-5 flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h3 className="font-semibold">Tingkat Kepatuhan Warga</h3>
          <p className="text-xs text-slate-500">
            Persentase warga yang mengikuti anjuran load shifting.
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-full max-w-md">
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={kepatuhan}
            onChange={(e) => setKepatuhan(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
          <div className="flex gap-1.5 shrink-0">
            {PRESET.map((p) => (
              <button
                key={p}
                onClick={() => setKepatuhan(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  kepatuhan === p
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ResultCard
          icon="⛽"
          iconBg="bg-red-50"
          label="Solar Dihemat / hari"
          value={`${num(h.liter)} `}
          unit="L"
          sub={`≈ ${num(h.literBulan)} L / bulan`}
          subClass="text-brand-600"
        />
        <ResultCard
          icon="💰"
          iconBg="bg-amber-50"
          label="Penghematan Biaya / hari"
          value={idr(h.biaya)}
          unit=""
          sub={`≈ ${idr(h.biayaBulan)} / bulan`}
          subClass="text-brand-600"
        />
        <ResultCard
          icon="🌱"
          iconBg="bg-brand-50"
          label="Reduksi Emisi CO₂ / hari"
          value={`${num(h.co2)} `}
          unit="kg"
          sub={`≈ ${num(h.pohonTahun)} pohon/tahun (dari total tahunan)`}
          subClass="text-slate-500"
        />

        <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col items-center">
          <p className="text-sm font-medium self-start">Tingkat Kepatuhan</p>
          <div className="relative w-32 h-32 my-1">
            <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#16A34A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="314"
                strokeDashoffset={gaugeOffset}
                style={{ transition: "stroke-dashoffset .3s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold">{kepatuhan}%</div>
              <div className="text-xs text-slate-500">warga patuh</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <div className="rounded-xl p-5 text-white bg-gradient-to-br from-brand-600 to-brand-800">
          <p className="text-sm text-white/90">Dampak Tahunan</p>
          <div className="text-2xl sm:text-3xl font-extrabold mt-1">
            {num(h.literTahun)} L
          </div>
          <p className="text-xs text-white/80 mt-1">
            solar terhemat jika kepatuhan bertahan.
          </p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 xl:col-span-3 text-sm text-slate-600 flex items-center">
          <b className="mr-1">Asumsi:</b> harga solar{" "}
          {idr(FUEL.hargaSolarPerLiter)}/L · 1 L ≈ {FUEL.co2PerLiter} kg CO₂ ·
          defisit rata-rata {FUEL.defisitRataRataKw} kW selama{" "}
          {FUEL.jamPotensiPergeseranPerHari} jam malam hari · genset{" "}
          {FUEL.literPerKwhGenset} L/kWh · serapan karbon 1 pohon{" "}
          {FUEL.co2SerapPohonPerTahun} kg/tahun.
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  sub,
  subClass,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  unit: string;
  sub: string;
  subClass: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <div className="text-2xl sm:text-3xl font-extrabold mt-1">
        {value}
        {unit && (
          <span className="text-base font-semibold text-slate-400">{unit}</span>
        )}
      </div>
      <p className={`text-xs mt-1.5 ${subClass}`}>{sub}</p>
    </div>
  );
}
