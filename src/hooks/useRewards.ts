"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { demoRewards } from "@/lib/demoData";
import { addWarga } from "@/lib/rewardActions";
import type {
  BUMDesReward,
  VoucherStock,
  RedemptionHistoryItem,
  RewardCatalogItem,
} from "@/lib/types";

export function useRewards() {
  const [rewards, setRewards] = useState<BUMDesReward[]>(
    isFirebaseConfigured ? [] : demoRewards,
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(
      collection(db, "BUMDes_rewards"),
      orderBy("total_poin", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRewards(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BUMDesReward, "id">),
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
  }, []);

  async function addReward(nama: string, nomorHp: string) {
    if (isFirebaseConfigured) {
      await addWarga(nama, nomorHp);
    } else {
      setRewards((prev) => [
        ...prev,
        {
          id: `demo-${Date.now()}`,
          user_id: `demo-${Date.now()}`,
          nama_warga: nama,
          nomor_hp: nomorHp,
          total_poin: 0,
          status: "Baru",
        },
      ]);
    }
  }

  return { rewards, loading, error, addReward };
}

export function useRewardCatalog() {
  const [items, setItems] = useState<RewardCatalogItem[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      query(collection(db, "reward_catalog"), orderBy("pointsRequired", "asc")),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RewardCatalogItem, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { items, loading };
}

export function useVouchers() {
  const [items, setItems] = useState<VoucherStock[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      collection(db, "voucher_stock"),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VoucherStock, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const stok = items.reduce<Record<string, { tersedia: number; terpakai: number }>>(
    (acc, v) => {
      const s = (acc[v.reward_id] ??= { tersedia: 0, terpakai: 0 });
      if (v.is_used) s.terpakai++;
      else s.tersedia++;
      return acc;
    },
    {},
  );

  return { items, stok, loading };
}

export function useRedemptionHistory(maks = 30) {
  const [items, setItems] = useState<RedemptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      query(
        collection(db, "redemption_history"),
        orderBy("timestamp", "desc"),
        limit(maks),
      ),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RedemptionHistoryItem, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [maks]);

  return { items, loading };
}
