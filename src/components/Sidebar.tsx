"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  Grid,
  Calculator,
  Bell,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  X,
  CheckCircle,
  Gift,
  Clock,
} from "./icons";

const MENU = [
  { href: "/", label: "Dashboard", Icon: Grid, badge: null, adminOnly: false },
  {
    href: "/kalkulator-bbm",
    label: "Kalkulator BBM",
    Icon: Calculator,
    badge: null,
    adminOnly: false,
  },
  {
    href: "/notifikasi",
    label: "Notifikasi",
    Icon: Bell,
    badge: "3",
    adminOnly: false,
  },
  {
    href: "/sesi",
    label: "Sesi Jam Emas",
    Icon: Clock,
    badge: null,
    adminOnly: true,
  },
  {
    href: "/verifikasi",
    label: "Verifikasi",
    Icon: CheckCircle,
    badge: null,
    adminOnly: true,
  },
  {
    href: "/hadiah",
    label: "Hadiah",
    Icon: Gift,
    badge: null,
    adminOnly: true,
  },
  {
    href: "/poin",
    label: "Manajemen Poin",
    Icon: Users,
    badge: null,
    adminOnly: true,
  },
];

export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const isAdmin = session?.role === "admin_bumdes";

  return (
    <aside
      className={`fixed left-0 top-0 h-dvh w-64 bg-white border-r border-slate-200 flex flex-col z-40
        transition-transform duration-200 lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="px-5 py-5 flex items-center gap-2">
        {/* Logo colokan listrik; sudah berbentuk lingkaran hijau sendiri,
            jadi tidak dibungkus lingkaran brand seperti ikon petir dulu. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-islandgrid.png"
          alt="IslandGrid AI"
          width={36}
          height={36}
          className="w-9 h-9 shrink-0"
        />
        <span className="font-bold text-lg">
          IslandGrid <span className="text-brand-600">AI</span>
        </span>
        {/* tombol tutup — hanya tampil di layar kecil */}
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 mt-2 text-sm">
        <p className="px-3 text-[11px] font-semibold tracking-wide text-slate-400 mb-1">
          MENU
        </p>
        {MENU.filter((m) => !m.adminOnly || isAdmin).map(
          ({ href, label, Icon, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  active
                    ? "text-brand-700 bg-brand-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded bg-brand-600 transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon className="w-[18px] h-[18px]" />
                {label}
                {badge && (
                  <span className="ml-auto text-[11px] font-bold text-white bg-brand-600 rounded-full px-2 py-0.5">
                    {badge}
                  </span>
                )}
              </Link>
            );
          },
        )}

        <p className="px-3 text-[11px] font-semibold tracking-wide text-slate-400 mt-5 mb-1">
          GENERAL
        </p>
        {[
          { href: "/pengaturan", label: "Pengaturan", Icon: Settings },
          { href: "/bantuan", label: "Bantuan", Icon: HelpCircle },
        ].map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                active
                  ? "text-brand-700 bg-brand-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded bg-brand-600 transition-opacity ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Keluar
        </button>
      </nav>

      <div className="m-4 rounded-xl p-4 text-white bg-gradient-to-br from-slate-800 to-brand-900">
        <p className="font-semibold text-sm">Panduan Load Shifting</p>
        <p className="text-xs text-slate-300 mt-0.5 mb-3">
          Cara pindahkan beban warga saat defisit.
        </p>
        <Link
          href="/bantuan"
          className="inline-block text-xs font-semibold bg-brand-600 hover:bg-brand-500 rounded-full px-3 py-1.5"
        >
          Buka Panduan
        </Link>
      </div>
    </aside>
  );
}
