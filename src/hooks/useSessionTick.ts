"use client";

import { useEffect } from "react";

const JEDA_MS = 60_000;

export function useSessionTick() {
  useEffect(() => {
    const jalankan = () => {
      if (document.hidden) return;
      fetch("/api/sessions/tick", {
        method: "POST",
        headers: { "x-from-dashboard": "1" },
      }).catch(() => {});
    };
    const awal = setTimeout(jalankan, 0);
    const id = setInterval(jalankan, JEDA_MS);
    return () => {
      clearTimeout(awal);
      clearInterval(id);
    };
  }, []);
}
