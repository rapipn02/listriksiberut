"use client";

import { useEffect, useState } from "react";

export default function Countdown({ startSeconds = 3600 + 24 * 60 + 4 }) {
  const [t, setT] = useState(startSeconds);
  useEffect(() => {
    const id = setInterval(() => setT((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return (
    <span className="tabular-nums">
      {h}:{m}:{s}
    </span>
  );
}
