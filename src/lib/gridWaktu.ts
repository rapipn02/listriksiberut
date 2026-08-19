export interface TitikGrid {
  waktuMs: number;
  jam: string;
  defisit: boolean;
}

export interface TargetWaktu {
  sedangDefisit: boolean;
  arah: "menuju_defisit" | "menuju_aman";
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
  const sedangDefisit = Boolean(kini?.defisit);

  const beda = urut.find(
    (t) => t.waktuMs > sekarangMs && t.defisit !== sedangDefisit,
  );

  return {
    sedangDefisit,
    arah: sedangDefisit ? "menuju_aman" : "menuju_defisit",
    targetMs: beda?.waktuMs ?? null,
    jam: beda?.jam ?? null,
  };
}
