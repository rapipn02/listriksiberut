"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { BroadcastNotification } from "@/lib/types";

/** Riwayat broadcast terbaru — dipakai dropdown lonceng & halaman Notifikasi. */
export function useBroadcasts(max = 8) {
  const [items, setItems] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(
      collection(db, "broadcast_notifications"),
      orderBy("timestamp", "desc"),
      limit(max),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BroadcastNotification, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [max]);

  return { items, loading };
}

/** "3 menit lalu", "2 jam lalu", "kemarin" */
export function waktuRelatif(d: Date): string {
  const detik = Math.floor((Date.now() - d.getTime()) / 1000);
  if (detik < 60) return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  if (detik < 172800) return "kemarin";
  return `${Math.floor(detik / 86400)} hari lalu`;
}
