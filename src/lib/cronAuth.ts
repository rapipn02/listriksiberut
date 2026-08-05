export function cronDiizinkan(request: Request): boolean {
  const rahasia = process.env.CRON_SECRET;

  if (!rahasia) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-cron-secret") === rahasia;
}

export function tolakCron() {
  return Response.json(
    { ok: false, error: "Tidak diizinkan." },
    { status: 401 },
  );
}
