import type { GridStatus } from "./types";

export interface TampilanStatus {
  label: string;
  pesan: string;
  kondisi: string;
  grad: string;
  teks: string;
  pill: string;
  titik: string;
}

export const STATUS_GRID: Record<GridStatus, TampilanStatus> = {
  NORMAL: {
    label: "NORMAL",
    pesan: "Kondisi grid stabil.",
    kondisi: "Pasokan PLTS + PLTD mencukupi beban.",
    grad: "from-brand-600 to-brand-800",
    teks: "text-white",
    pill: "text-brand-700 bg-brand-50",
    titik: "bg-brand-600",
  },
  WARNING: {
    label: "WARNING",
    pesan: "Waspada potensi penurunan daya surya (≤ 20%).",
    kondisi: "Potensi penurunan daya surya sampai 20%.",
    grad: "from-amber-300 to-amber-400",
    teks: "text-slate-900",
    pill: "text-amber-800 bg-amber-100",
    titik: "bg-amber-400",
  },
  ALERT: {
    label: "ALERT",
    pesan: "Bahaya! Defisit daya surya kritis (> 20%).",
    kondisi: "Defisit daya surya lebih dari 20%.",
    grad: "from-red-500 to-red-700",
    teks: "text-white",
    pill: "text-red-700 bg-red-50",
    titik: "bg-red-600",
  },
};

export function tampilanStatus(status?: GridStatus): TampilanStatus {
  return STATUS_GRID[status ?? "NORMAL"] ?? STATUS_GRID.NORMAL;
}
