"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Bolt } from "@/components/icons";

const AKUN = [
  {
    email: "admin@bumdes.id",
    ket: "Admin BUMDes · akses penuh",
    titik: "bg-brand-500",
  },
  {
    email: "teknisi@bumdes.id",
    ket: "Teknisi PLTD · tanpa Sesi, Verifikasi, Hadiah & Poin",
    titik: "bg-blue-500",
  },
];

/** Ubah kode error Firebase jadi kalimat yang dimengerti operator. */
function pesanRamah(err: unknown): string {
  const kode =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: string }).code)
      : "";
  switch (kode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi salah.";
    case "auth/invalid-email":
      return "Format email tidak benar.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Tunggu beberapa menit.";
    case "auth/network-request-failed":
      return "Tidak ada koneksi ke server. Periksa jaringan.";
    default:
      return err instanceof Error ? err.message : "Gagal masuk.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, loginReal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/");
  }, [loading, session, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await loginReal(email, password);
      router.replace("/");
    } catch (err) {
      setError(pesanRamah(err));
    } finally {
      setBusy(false);
    }
  }

  /** Isi form dengan akun terpilih — pengguna tetap menekan "Masuk". */
  function isiForm(accEmail: string) {
    setError("");
    setEmail(accEmail);
    setPassword("password123");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-7">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white">
            <Bolt className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg">
            IslandGrid <span className="text-brand-600">AI</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold">Masuk Operator</h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Dashboard prediksi daya PLTS + PLTD Pulau Siberut, Mentawai.
        </p>

        {!isFirebaseConfigured && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Firebase belum dikonfigurasi — login tidak akan berhasil. Isi
            <code className="mx-1 px-1 bg-amber-100 rounded">.env.local</code>
            terlebih dahulu.
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@bumdes.id"
            className="w-full mt-1 mb-4 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <label className="text-sm font-medium">Kata Sandi</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 mb-2 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold transition mt-3"
          >
            {busy ? "Memproses…" : "Masuk"}
          </button>
        </form>

        {/* Daftar akun hanya mengisi form — login tetap lewat Firebase Auth.
            Sebelumnya tombol ini melakukan bypass tanpa autentikasi, sehingga
            Firestore menolak semua pembacaan dan dashboard tampil kosong. */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 mb-2">
            AKUN OPERATOR — KLIK UNTUK MENGISI
          </p>
          {AKUN.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => isiForm(a.email)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition flex items-center gap-3 mb-2 last:mb-0 ${
                email === a.email
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${a.titik}`} />
              <span>
                <span className="font-semibold text-sm">{a.email}</span>
                <br />
                <span className="text-xs text-slate-500">{a.ket}</span>
              </span>
            </button>
          ))}
          <p className="text-xs text-slate-500 mt-3">
            Kata sandi semua akun:{" "}
            <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">
              password123
            </code>
          </p>
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">
          BUMDes Siberut · v1.0
          {isFirebaseConfigured ? "" : " · Firebase belum dikonfigurasi"}
        </p>
      </div>
    </div>
  );
}
