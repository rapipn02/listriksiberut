// Penjaga sederhana untuk route yang dipanggil cron server.
// Tanpa ini siapa pun bisa memicu broadcast massal ke seluruh warga.

export function cronDiizinkan(request: Request): boolean {
  const rahasia = process.env.CRON_SECRET;
  // Tanpa CRON_SECRET terpasang, route dibiarkan terbuka hanya di pengembangan.
  if (!rahasia) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-cron-secret") === rahasia;
}

export function tolakCron() {
  return Response.json(
    { ok: false, error: "Tidak diizinkan." },
    { status: 401 },
  );
}
