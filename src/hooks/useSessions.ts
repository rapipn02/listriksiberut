"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { LoadShiftSession } from "@/lib/types";

/** Sesi Jam Emas — koleksi bersama dengan aplikasi mobile. */
export function useSessions(maks = 30) {
  const [items, setItems] = useState<LoadShiftSession[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      query(
        collection(db, "load_shift_sessions"),
        orderBy("startAt", "desc"),
        limit(maks),
      ),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LoadShiftSession, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [maks]);

  const aktif = items.filter((s) => s.status === "ACTIVE");
  const mendatang = items.filter((s) => s.status === "UPCOMING");

  return { items, loading, aktif, mendatang };
}
