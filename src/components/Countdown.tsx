"use client";

import { useEffect, useState } from "react";
import { targetBerikut, type TargetWaktu, type TitikGrid } from "@/lib/gridWaktu";

export default function KartuWaktuGrid({ titik }: { titik: TitikGrid[] }) {
  const [target, setTarget] = useState<TargetWaktu | null>(null);
  const [sisaMs, setSisaMs] = useState(0);

  useEffect(() => {
    const hitung = () => {
      const sekarang = Date.now();
      const t = targetBerikut(titik, sekarang);
      setTarget(t);
      setSisaMs(t.targetMs ? Math.max(0, t.targetMs - sekarang) : 0);
    };
    const awal = setTimeout(hitung, 0);
    const id = setInterval(hitung, 1000);
    return () => {
      clearTimeout(awal);
      clearInterval(id);
    };
  }, [titik]);

  const sedangSurplus = target?.sedangSurplus ?? false;
  const judul = sedangSurplus ? "Surplus Surya Berlangsung" : "Waktu Menuju Surplus";
  const sub = sedangSurplus
    ? "Sisa waktu sebelum beban melampaui surya"
    : "Perkiraan saat produksi surya melampaui beban";

  let utama = "--:--:--";
  let catatan = "menghitung…";
  let kecil = false;
  let hijau = sedangSurplus;

  if (target) {
    if (target.targetMs) {
      const detik = Math.floor(sisaMs / 1000);
      const h = String(Math.floor(detik / 3600)).padStart(2, "0");
      const m = String(Math.floor((detik % 3600) / 60)).padStart(2, "0");
      const s = String(detik % 60).padStart(2, "0");
      utama = `${h}:${m}:${s}`;
      catatan = `jam : menit : detik · ${
        sedangSurplus ? "berakhir" : "mulai"
      } pukul ${target.jam}`;
    } else if (sedangSurplus) {
      utama = "SURPLUS BERLANJUT";
      catatan = "Surya masih melampaui beban sepanjang prakiraan";
      kecil = true;
      hijau = true;
    } else {
      utama = "TIDAK ADA SURPLUS";
      catatan = "Prakiraan 24 jam: beban selalu melampaui surya";
      kecil = true;
      hijau = false;
    }
  }

  return (
    <div className="rounded-xl p-5 text-white bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{judul}</h3>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
        <span
          className={`text-[10px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1 shrink-0 ${
            hijau
              ? "text-brand-300 bg-brand-500/20"
              : "text-amber-300 bg-amber-500/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hijau ? "bg-brand-400" : "bg-amber-400"
            }`}
          />
          LIVE
        </span>
      </div>
      <div
        className={`font-extrabold mt-6 mb-1 tabular-nums ${
          kecil ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl tracking-widest"
        }`}
      >
        {utama}
      </div>
      <p className="text-xs text-slate-400">{catatan}</p>
    </div>
  );
}
