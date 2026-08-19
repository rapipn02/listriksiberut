"use client";

import { useEffect, useState } from "react";

export interface TitikDefisit {
  waktuMs: number;
  jam: string;
}

export default function Countdown({ titik }: { titik: TitikDefisit[] }) {
  const [berikut, setBerikut] = useState<{ sisaMs: number; jam: string } | null>(
    null,
  );
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const hitung = () => {
      const sekarang = Date.now();
      const depan = titik.find((t) => t.waktuMs > sekarang);
      setBerikut(
        depan ? { sisaMs: depan.waktuMs - sekarang, jam: depan.jam } : null,
      );
      setSiap(true);
    };
    const awal = setTimeout(hitung, 0);
    const id = setInterval(hitung, 1000);
    return () => {
      clearTimeout(awal);
      clearInterval(id);
    };
  }, [titik]);

  if (!siap) return <Blok utama="--:--:--" catatan="menghitung…" />;
  if (!berikut)
    return (
      <Blok utama="AMAN" catatan="Tidak ada defisit dalam prakiraan" kecil />
    );

  const detik = Math.floor(berikut.sisaMs / 1000);
  const h = String(Math.floor(detik / 3600)).padStart(2, "0");
  const m = String(Math.floor((detik % 3600) / 60)).padStart(2, "0");
  const s = String(detik % 60).padStart(2, "0");

  return (
    <Blok
      utama={`${h}:${m}:${s}`}
      catatan={`jam : menit : detik · mulai pukul ${berikut.jam}`}
    />
  );
}

function Blok({
  utama,
  catatan,
  kecil,
}: {
  utama: string;
  catatan: string;
  kecil?: boolean;
}) {
  return (
    <>
      <div
        className={`font-extrabold mt-6 mb-1 tabular-nums ${
          kecil ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl tracking-widest"
        }`}
      >
        {utama}
      </div>
      <p className="text-xs text-slate-400">{catatan}</p>
    </>
  );
}
