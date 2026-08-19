import type { GridStatus } from "./types";

export interface ForecastPoint {
  jam: string;
  beban: number;
  plts: number;
  deficit: boolean;
  waktuMs?: number;
}

export interface WeatherNow {
  cloud: number;
  ghi: number;
  suhu: number;
}

export const demoStatus = {
  current_status: "ALERT" as GridStatus,
  total_plts_capacity_kw: 300,
  total_pltd_capacity_kw: 500,
};

export const demoWeather: WeatherNow = { cloud: 75, ghi: 320, suhu: 29 };

export function buildDemoForecasts(): ForecastPoint[] {
  const out: ForecastPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const plts = Math.round(185 * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)));
    const load = Math.round(
      120 +
        90 * Math.exp(-((h - 19) ** 2) / 8) +
        45 * Math.exp(-((h - 8) ** 2) / 6),
    );
    out.push({
      jam: `${String(h).padStart(2, "0")}:00`,
      beban: load,
      plts,
      deficit: load > plts,
    });
  }
  return out;
}

export const demoRewards = [
  { id: "1", user_id: "u1", nama_warga: "Java Maulana", nomor_hp: "0812-3456-7890", total_poin: 150, status: "Aktif" as const },
  { id: "2", user_id: "u2", nama_warga: "Siti Rahma", nomor_hp: "0821-9876-5432", total_poin: 132, status: "Aktif" as const },
  { id: "3", user_id: "u3", nama_warga: "Rudi Hartono", nomor_hp: "0813-7778-8899", total_poin: 118, status: "Baru" as const },
  { id: "4", user_id: "u4", nama_warga: "Nia Kurnia", nomor_hp: "0856-1112-2233", total_poin: 96, status: "Aktif" as const },
  { id: "5", user_id: "u5", nama_warga: "Doni Saputra", nomor_hp: "0878-2223-3344", total_poin: 74, status: "Pending" as const },
  { id: "6", user_id: "u6", nama_warga: "Lastri Wulandari", nomor_hp: "0899-5556-6677", total_poin: 58, status: "Nonaktif" as const },
];
