"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  buildDemoForecasts,
  demoWeather,
  type ForecastPoint,
  type WeatherNow,
} from "@/lib/demoData";
import type { PowerForecast } from "@/lib/types";

export function usePowerForecasts() {
  const [points, setPoints] = useState<ForecastPoint[]>(
    isFirebaseConfigured ? [] : buildDemoForecasts(),
  );
  const [weather, setWeather] = useState<WeatherNow>(demoWeather);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const now = Date.now();
    const q = query(
      collection(db, "power_forecasts"),
      where("timestamp", ">=", Timestamp.fromDate(new Date(now - 3600_000))),
      where("timestamp", "<", Timestamp.fromDate(new Date(now + 48 * 3600_000))),
      orderBy("timestamp", "asc"),
      limit(48),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PowerForecast, "id">),
        }));
        setPoints(
          docs.map((d) => {
            const date = d.timestamp?.toDate?.() ?? new Date();
            return {
              jam: `${String(date.getHours()).padStart(2, "0")}:00`,
              beban: d.projected_load_kw,
              plts: d.predicted_plts_kw,
              deficit: d.deficit_flag,
            };
          }),
        );
        if (docs.length) {
          const cur = docs[0];
          setWeather({
            cloud: cur.cloud_cover_percent,
            ghi: cur.ghi_radiation,
            suhu: 29,
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { points, weather, loading, error };
}
