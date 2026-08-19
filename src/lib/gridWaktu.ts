export interface TitikGrid {
  waktuMs: number;
  jam: string;
  surplus: boolean;
}

export interface TargetWaktu {
  sedangSurplus: boolean;
  arah: "menuju_surplus" | "menuju_habis";
  targetMs: number | null;
  jam: string | null;
}

export function targetBerikut(
  titik: TitikGrid[],
  sekarangMs: number,
): TargetWaktu {
  const urut = [...titik].sort((a, b) => a.waktuMs - b.waktuMs);
  const lewat = urut.filter((t) => t.waktuMs <= sekarangMs);
  const kini = lewat.length > 0 ? lewat[lewat.length - 1] : urut[0];
  const sedangSurplus = Boolean(kini?.surplus);

  const beda = urut.find(
    (t) => t.waktuMs > sekarangMs && t.surplus !== sedangSurplus,
  );

  return {
    sedangSurplus,
    arah: sedangSurplus ? "menuju_habis" : "menuju_surplus",
    targetMs: beda?.waktuMs ?? null,
    jam: beda?.jam ?? null,
  };
}
