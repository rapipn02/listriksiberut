"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useBroadcasts, waktuRelatif } from "@/hooks/useBroadcasts";
import { Search, Bell, Menu } from "./icons";

function initials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { session } = useAuth();
  const { items } = useBroadcasts(6);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!session) return null;
  const isAdmin = session.role === "admin_bumdes";

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-3">

      <button
        onClick={onMenuClick}
        aria-label="Buka menu"
        className="lg:hidden w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-2.5 w-[18px] h-[18px] text-slate-400" />
        <input
          placeholder="Cari warga, laporan, jadwal…"
          className="w-full pl-10 pr-14 py-2 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:outline-none text-sm"
        />
        <span className="absolute right-3 top-2 text-[11px] text-slate-400 border border-slate-300 rounded px-1.5 py-0.5 hidden md:inline">
          ⌘F
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">

        <div className="relative" ref={wrapRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Riwayat notifikasi"
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {items.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-brand-500" />
            )}
          </button>

          {open && (
            <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-sm">Broadcast Terkirim</p>
                <p className="text-xs text-slate-500">
                  Pesan terakhir ke warga Siberut
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-400 text-center">
                    Belum ada broadcast terkirim.
                  </p>
                ) : (
                  items.map((b) => (
                    <div
                      key={b.id}
                      className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <p className="font-medium text-sm">{b.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {b.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {b.timestamp?.toDate
                          ? waktuRelatif(b.timestamp.toDate())
                          : ""}{" "}
                        · {b.target_topic}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/notifikasi");
                }}
                className="w-full py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 border-t border-slate-100"
              >
                Buka Pusat Notifikasi
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 sm:pl-2">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full text-white flex items-center justify-center font-semibold text-sm ${
              isAdmin ? "bg-brand-600" : "bg-blue-500"
            }`}
          >
            {initials(session.nama)}
          </div>

          <div className="text-sm leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-semibold hidden md:inline">
                {session.nama}
              </span>
              <span
                className={`text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${
                  isAdmin
                    ? "text-brand-700 bg-brand-100"
                    : "text-blue-700 bg-blue-100"
                }`}
              >
                {isAdmin ? "Admin BUMDes" : "Teknisi PLTD"}
              </span>
            </div>
            <span className="text-xs text-slate-500 hidden md:inline">
              {session.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
