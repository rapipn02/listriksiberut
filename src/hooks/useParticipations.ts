"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { ParticipationRequest } from "@/lib/types";

/** Pengajuan foto bukti warga, terbaru dulu. */
export function useParticipations(maks = 50) {
  const [items, setItems] = useState<ParticipationRequest[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(
      collection(db, "participation_requests"),
      orderBy("timestamp", "desc"),
      limit(maks),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ParticipationRequest, "id">),
          })),
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [maks]);

  const menunggu = items.filter((i) => i.status === "PENDING").length;
  const disetujui = items.filter((i) => i.status === "APPROVED").length;
  const ditolak = items.filter((i) => i.status === "REJECTED").length;

  return { items, loading, error, menunggu, disetujui, ditolak };
}
