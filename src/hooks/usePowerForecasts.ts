"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  getDocs,
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
              waktuMs: date.getTime(),
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

export interface HariSurya {
  hari: string;
  kwh: number;
}

export function useSolarWeekly() {
  const [hari, setHari] = useState<HariSurya[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const now = Date.now();
    const q = query(
      collection(db, "power_forecasts"),
      where("timestamp", ">=", Timestamp.fromDate(new Date(now - 7 * 86400_000))),
      where("timestamp", "<", Timestamp.fromDate(new Date(now))),
      orderBy("timestamp", "asc"),
    );

    let batal = false;
    getDocs(q)
      .then((snap) => {
        if (batal) return;
        const perHari = new Map<number, number>();
        snap.docs.forEach((d) => {
          const v = d.data() as PowerForecast;
          const t = v.timestamp?.toDate?.();
          if (!t) return;
          const kunci = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
          perHari.set(kunci, (perHari.get(kunci) ?? 0) + (v.predicted_plts_kw ?? 0));
        });
        setHari(
          [...perHari.entries()]
            .slice(-7)
            .map(([kunci, kwh]) => ({
              hari: new Date(kunci).toLocaleDateString("id-ID", { weekday: "short" }),
              kwh: Math.round(kwh),
            })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      batal = true;
    };
  }, []);

  return { hari, loading };
}
