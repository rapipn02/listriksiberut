const TANDA: ReadonlyArray<readonly [string, string]> = [
  ["/9j/", "image/jpeg"],
  ["iVBORw0KGgo", "image/png"],
  ["R0lGOD", "image/gif"],
  ["UklGR", "image/webp"],
  ["Qk", "image/bmp"],
];

function rapikan(b64: string): string {
  return b64.replace(/\s+/g, "");
}

export function tebakMime(b64: string): string | null {
  const bersih = rapikan(b64);
  for (const [awalan, mime] of TANDA) {
    if (bersih.startsWith(awalan)) return mime;
  }
  return null;
}

export function dataUrlFoto(b64: unknown): string | null {
  if (typeof b64 !== "string") return null;
  const bersih = rapikan(b64);
  if (!bersih) return null;
  if (bersih.startsWith("data:")) {
    return bersih.startsWith("data:image/") ? bersih : null;
  }
  if (bersih.startsWith("http://") || bersih.startsWith("https://")) {
    return bersih;
  }
  const mime = tebakMime(bersih);
  if (!mime) return null;
  return `data:${mime};base64,${bersih}`;
}

export function ukuranKb(b64: string): number {
  const bersih = rapikan(b64).replace(/^data:[^,]+,/, "");
  const padding = (bersih.match(/=+$/)?.[0].length ?? 0);
  const byte = Math.max(0, (bersih.length * 3) / 4 - padding);
  return Math.round(byte / 1024);
}

export function totalUkuranKb(fotos: readonly string[] | undefined): number {
  return (fotos ?? []).reduce((t, f) => t + ukuranKb(f), 0);
}
