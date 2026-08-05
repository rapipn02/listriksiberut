import type { ForecastPoint } from "./demoData";

export interface GreenWindow {
  mulai: string;
  selesai: string;
  surplusKw: number;
  jam: number;
}

export function findGreenWindow(points: ForecastPoint[]): GreenWindow | null {
  if (points.length === 0) return null;

  let best: { start: number; end: number } | null = null;
  let run: { start: number; end: number } | null = null;

  points.forEach((p, i) => {
    const surplus = p.plts > p.beban;
    if (surplus) {
      run = run ? { start: run.start, end: i } : { start: i, end: i };
      const runLen = run.end - run.start;
      const bestLen = best ? best.end - best.start : -1;
      if (runLen > bestLen) best = run;
    } else {
      run = null;
    }
  });

  if (!best) return null;
  const { start, end } = best as { start: number; end: number };

  let surplusKw = 0;
  for (let i = start; i <= end; i++) {
    surplusKw = Math.max(surplusKw, points[i].plts - points[i].beban);
  }

  const endHour = (Number(points[end].jam.slice(0, 2)) + 1) % 24;

  return {
    mulai: points[start].jam,
    selesai: `${String(endHour).padStart(2, "0")}:00`,
    surplusKw: Math.round(surplusKw),
    jam: end - start + 1,
  };
}
