/**
 * Foto bukti dari aplikasi mobile dikirim sebagai Base64 di dalam dokumen
 * Firestore (bukan URL Storage). Berkas ini mengubahnya jadi data URL yang
 * bisa dipakai <img>, sekaligus menebak jenis berkasnya dari byte pertama.
 *
 * Jenis ditebak, bukan dipaku "image/jpeg", karena kamera Android bisa
 * menghasilkan PNG (tangkapan layar) atau WebP tergantung pengaturan.
 */

/** Awalan Base64 khas tiap format gambar (hasil enkode byte penanda). */
const TANDA: ReadonlyArray<readonly [string, string]> = [
  ["/9j/", "image/jpeg"], // FF D8 FF
  ["iVBORw0KGgo", "image/png"], // \x89PNG\r\n\x1a\n
  ["R0lGOD", "image/gif"], // GIF8
  ["UklGR", "image/webp"], // RIFF
  ["Qk", "image/bmp"], // BM
];

/** Buang spasi/baris baru yang kadang terbawa saat Base64 disalin. */
function rapikan(b64: string): string {
  return b64.replace(/\s+/g, "");
}

/** Tebak MIME dari isi Base64. Kembalikan null bila tidak dikenali. */
export function tebakMime(b64: string): string | null {
  const bersih = rapikan(b64);
  for (const [awalan, mime] of TANDA) {
    if (bersih.startsWith(awalan)) return mime;
  }
  return null;
}

/**
 * Ubah satu entri `photosBase64` jadi data URL siap pakai.
 * Menerima Base64 mentah maupun yang sudah berupa data URL.
 * Kembalikan null bila kosong atau jelas bukan gambar.
 */
export function dataUrlFoto(b64: unknown): string | null {
  if (typeof b64 !== "string") return null;
  const bersih = rapikan(b64);
  if (!bersih) return null;
  if (bersih.startsWith("data:")) {
    // Sudah lengkap dari mobile — pakai apa adanya asal benar-benar gambar.
    return bersih.startsWith("data:image/") ? bersih : null;
  }
  if (bersih.startsWith("http://") || bersih.startsWith("https://")) {
    // Toleransi bila suatu saat mobile pindah ke URL Storage.
    return bersih;
  }
  const mime = tebakMime(bersih);
  if (!mime) return null;
  return `data:${mime};base64,${bersih}`;
}

/** Perkiraan ukuran berkas dalam KB — untuk memantau batas 1 MiB/dokumen. */
export function ukuranKb(b64: string): number {
  const bersih = rapikan(b64).replace(/^data:[^,]+,/, "");
  const padding = (bersih.match(/=+$/)?.[0].length ?? 0);
  const byte = Math.max(0, (bersih.length * 3) / 4 - padding);
  return Math.round(byte / 1024);
}

/** Total ukuran semua foto satu pengajuan, dalam KB. */
export function totalUkuranKb(fotos: readonly string[] | undefined): number {
  return (fotos ?? []).reduce((t, f) => t + ukuranKb(f), 0);
}
