// Picu prediksi ulang di layanan ML (FastAPI), lalu ML menulis hasilnya ke Firestore.
// Dipanggil server-side saja: ISLANDGRID_API_KEY tidak boleh sampai ke browser
// (peringatan eksplisit di docs/FIRESTORE_CONTRACT.md tim ML).
const TIMEOUT_MS = 30_000; // jalankan model bisa lambat

export async function POST() {
  const base = process.env.ISLANDGRID_API_BASE_URL;
  const key = process.env.ISLANDGRID_API_KEY;

  if (!base || !key) {
    return Response.json(
      { ok: false, error: "Layanan prediksi belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/forecast/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-IslandGrid-Key": key,
      },
      body: JSON.stringify({ hours: 48, sync_firestore: true }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return Response.json(
        { ok: false, error: `Layanan ML membalas ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return Response.json({
      ok: true,
      current_status: data?.current_status ?? null,
      records: Array.isArray(data?.forecasts) ? data.forecasts.length : null,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return Response.json(
      {
        ok: false,
        error: aborted
          ? "Layanan prediksi tidak merespons (timeout)."
          : "Layanan prediksi tidak tersedia.",
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timer);
  }
}
