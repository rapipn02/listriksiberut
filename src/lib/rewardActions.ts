// Aksi tulis Firestore untuk halaman Poin, Notifikasi & Hadiah (Admin BUMDes).
import {
  addDoc,
  collection,
  doc,
  increment,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { RewardCatalogItem } from "./types";

/** Setujui penukaran hadiah: kurangi poin warga (dibelanjakan) + tandai approved. */
export async function approveRedemption(
  requestId: string,
  uid: string,
  poin: number,
) {
  await updateDoc(doc(db, "redemption_requests", requestId), {
    status: "approved",
  });
  await updateDoc(doc(db, "BUMDes_rewards", uid), {
    total_poin: increment(-poin),
  });
}

/** Tolak penukaran: poin warga tidak berkurang. */
export async function rejectRedemption(requestId: string) {
  await updateDoc(doc(db, "redemption_requests", requestId), {
    status: "rejected",
  });
}

/** Tambah warga baru ke daftar poin BUMDes. */
export async function addWarga(nama: string, nomorHp: string) {
  await addDoc(collection(db, "BUMDes_rewards"), {
    nama_warga: nama,
    nomor_hp: nomorHp,
    total_poin: 0,
  });
}

/** Simpan besaran poin insentif per partisipasi. */
export async function saveInsentifPoin(poin: number) {
  await setDoc(
    doc(db, "settings", "notifikasi"),
    { poin_per_partisipasi: poin },
    { merge: true },
  );
}

/** Nyalakan/matikan pengiriman imbauan otomatis. */
export async function setAutoBroadcast(aktif: boolean) {
  await setDoc(
    doc(db, "settings", "notifikasi"),
    { auto_broadcast_aktif: aktif },
    { merge: true },
  );
}

// ---------- Verifikasi manual ----------

/**
 * Operator menimpa keputusan mesin (atau menilai lebih dulu).
 * Poin ditambahkan lewat increment supaya tidak bentrok dengan mesin otomatis.
 */
export async function putuskanPartisipasi(
  id: string,
  userId: string,
  setujui: boolean,
  poin: number,
  namaOperator: string,
) {
  await updateDoc(doc(db, "participation_requests", id), {
    status: setujui ? "APPROVED" : "REJECTED",
    poinDiberikan: setujui ? poin : 0,
    verifiedAt: serverTimestamp(),
    verificationReason: setujui
      ? `Disetujui manual oleh ${namaOperator}.`
      : `Ditolak manual oleh ${namaOperator}.`,
  });
  if (setujui) {
    await setDoc(
      doc(db, "BUMDes_rewards", userId),
      { total_poin: increment(poin) },
      { merge: true },
    );
  }
}

// ---------- Katalog & stok voucher ----------

export async function tambahHadiah(
  data: Omit<RewardCatalogItem, "id">,
): Promise<string> {
  const ref = await addDoc(collection(db, "reward_catalog"), data);
  return ref.id;
}

export async function ubahAktifHadiah(id: string, aktif: boolean) {
  await updateDoc(doc(db, "reward_catalog", id), { aktif });
}

/**
 * Tambah banyak kode voucher sekaligus (satu kode per baris).
 * Mengembalikan jumlah kode yang benar-benar ditulis setelah dibersihkan.
 */
export async function tambahVoucherMassal(
  rewardId: string,
  teksKode: string,
): Promise<number> {
  const kodeList = Array.from(
    new Set(
      teksKode
        .split(/\r?\n/)
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  );
  if (kodeList.length === 0) return 0;

  // Firestore membatasi 500 operasi per batch.
  const POTONG = 400;
  for (let i = 0; i < kodeList.length; i += POTONG) {
    const batch = writeBatch(db);
    for (const code of kodeList.slice(i, i + POTONG)) {
      batch.set(doc(collection(db, "voucher_stock")), {
        reward_id: rewardId,
        code,
        is_used: false,
      });
    }
    await batch.commit();
  }
  return kodeList.length;
}
