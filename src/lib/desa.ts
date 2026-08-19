import type { SystemStatus } from "./types";

export const TOTAL_KK_ASUMSI = 327;

export function totalKk(status?: SystemStatus | null): number {
  const dariMl = status?.total_households;
  return typeof dariMl === "number" && dariMl > 0 ? dariMl : TOTAL_KK_ASUMSI;
}

export function persenPartisipasi(peserta: number, total: number): number {
  if (!Number.isFinite(peserta) || !Number.isFinite(total) || total <= 0) return 0;
  const p = (Math.max(0, peserta) / total) * 100;
  return Math.round(p * 10) / 10;
}

export function persenTeks(p: number): string {
  return String(p).replace(".", ",");
}

export function ringkasPartisipasi(peserta: number, total: number): string {
  return `${peserta} dari ${total} KK ikut (${persenTeks(
    persenPartisipasi(peserta, total),
  )}%)`;
}
