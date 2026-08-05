"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { demoStatus } from "@/lib/demoData";
import type { SystemStatus } from "@/lib/types";

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(
    isFirebaseConfigured ? null : (demoStatus as SystemStatus),
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      doc(db, "system_status", "siberut_grid"),
      (snap) => {
        setStatus(
          snap.exists()
            ? (snap.data() as SystemStatus)
            : (demoStatus as SystemStatus),
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { status, loading, error };
}
