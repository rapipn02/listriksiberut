"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dataUrlFoto, ukuranKb } from "@/lib/photo";
import { ChevronLeft, ChevronRight, ImageOff, X } from "@/components/icons";

/* eslint-disable @next/next/no-img-element -- foto Base64 dari Firestore,
   bukan aset statis; next/image tidak bisa mengoptimalkan data URL. */

interface Props {
  /** Isi field `photosBase64` dari dokumen participation_requests. */
  foto?: string[];
  /** Nama warga — dipakai untuk teks alternatif dan judul lightbox. */
  nama: string;
}

/**
 * Semua foto bukti ditampilkan sebagai thumbnail; klik membuka pratinjau
 * ukuran penuh. Satu pengajuan bisa berisi beberapa foto, jadi tidak ada
 * yang disembunyikan — operator perlu melihat semuanya untuk menilai.
 */
export function BuktiFoto({ foto, nama }: Props) {
  const daftar = useMemo(() => foto ?? [], [foto]);
  // Base64 yang tidak dikenali disaring lebih dulu supaya tidak jadi
  // gambar patah tanpa keterangan.
  const url = useMemo(() => daftar.map((f) => dataUrlFoto(f)), [daftar]);
  const [rusak, setRusak] = useState<Set<number>>(new Set());
  const [buka, setBuka] = useState<number | null>(null);

  const tandaiRusak = useCallback((i: number) => {
    setRusak((s) => (s.has(i) ? s : new Set(s).add(i)));
  }, []);

  const geser = useCallback(
    (arah: number) => {
      setBuka((i) =>
        i === null ? null : (i + arah + daftar.length) % daftar.length,
      );
    },
    [daftar.length],
  );

  useEffect(() => {
    if (buka === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(null);
      else if (e.key === "ArrowLeft") geser(-1);
      else if (e.key === "ArrowRight") geser(1);
    };
    window.addEventListener("keydown", onKey);
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = sebelumnya;
    };
  }, [buka, geser]);

  if (daftar.length === 0) {
    return (
      <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 text-center px-1">
        tanpa foto
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-1 shrink-0 max-w-[8.75rem]">
        {daftar.map((b64, i) => {
          const src = url[i];
          const gagal = src === null || rusak.has(i);
          return gagal ? (
            <div
              key={i}
              title="Data foto tidak terbaca"
              className="w-16 h-16 rounded-lg bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-0.5 text-[9px] text-red-600"
            >
              <ImageOff className="w-4 h-4" />
              rusak
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setBuka(i)}
              title={`Foto ${i + 1} · ${ukuranKb(b64)} KB — klik untuk perbesar`}
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 group"
            >
              <img
                src={src}
                alt={`Bukti ${i + 1} dari ${nama}`}
                onError={() => tandaiRusak(i)}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              {daftar.length > 1 && (
                <span className="absolute bottom-0 right-0 px-1 text-[9px] font-semibold text-white bg-black/55 rounded-tl">
                  {i + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {buka !== null && url[buka] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Bukti foto ${nama}`}
          onClick={() => setBuka(null)}
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-3xl flex items-center justify-between text-white mb-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{nama}</p>
              <p className="text-xs text-white/70">
                Foto {buka + 1} dari {daftar.length} ·{" "}
                {ukuranKb(daftar[buka])} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBuka(null)}
              aria-label="Tutup"
              className="p-2 rounded-full hover:bg-white/15 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl flex items-center justify-center"
          >
            {daftar.length > 1 && (
              <button
                type="button"
                onClick={() => geser(-1)}
                aria-label="Foto sebelumnya"
                className="absolute left-1 sm:-left-12 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <img
              src={url[buka]!}
              alt={`Bukti ${buka + 1} dari ${nama}`}
              onError={() => tandaiRusak(buka)}
              className="max-h-[75vh] max-w-full rounded-xl object-contain bg-black/30"
            />
            {daftar.length > 1 && (
              <button
                type="button"
                onClick={() => geser(1)}
                aria-label="Foto berikutnya"
                className="absolute right-1 sm:-right-12 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-white/60 mt-3 text-center">
            Esc menutup · panah kiri/kanan berpindah foto
          </p>
        </div>
      )}
    </>
  );
}
