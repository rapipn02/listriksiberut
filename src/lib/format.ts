// Format angka lokal Indonesia.
export const num = (n: number): string => n.toLocaleString("id-ID");
export const idr = (n: number): string => "Rp " + n.toLocaleString("id-ID");
