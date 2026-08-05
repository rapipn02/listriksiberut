import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { SessionStatus } from "./types";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatTanggalId(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function gabungWaktu(tanggal: Date, jam: string): Date {
  const [h, m] = jam.split(":").map(Number);
  const out = new Date(tanggal);
  out.setHours(h ?? 0, m ?? 0, 0, 0);
  return out;
}

export interface SesiBaru {
  tanggal: Date;
  startTime: string;
  endTime: string;
  targetSavingKwh: number;
  capacityKw: number;
  poinPerPartisipasi: number;
}

export async function buatSesi(s: SesiBaru, dibuatOleh: string) {
  const startAt = gabungWaktu(s.tanggal, s.startTime);
  const endAt = gabungWaktu(s.tanggal, s.endTime);
  const sekarang = Date.now();

  await addDoc(collection(db, "load_shift_sessions"), {
    date: formatTanggalId(s.tanggal),
    startTime: s.startTime,
    endTime: s.endTime,

    status:
      sekarang >= endAt.getTime()
        ? "ENDED"
        : sekarang >= startAt.getTime()
          ? "ACTIVE"
          : "UPCOMING",
    targetSavingKwh: s.targetSavingKwh,
    capacityKw: s.capacityKw,
    currentLoadKw: 0,
    participantCount: 0,
    poin_per_partisipasi: s.poinPerPartisipasi,
    dibuat_oleh: dibuatOleh,
    startAt: Timestamp.fromDate(startAt),
    endAt: Timestamp.fromDate(endAt),
  });
}

export async function ubahStatusSesi(id: string, status: SessionStatus) {
  await updateDoc(doc(db, "load_shift_sessions", id), { status });
}

export async function hapusSesi(id: string) {
  await deleteDoc(doc(db, "load_shift_sessions", id));
}
