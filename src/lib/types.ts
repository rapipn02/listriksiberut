// Tipe data Firestore (snake_case, sesuai collection yang sudah ada).
import type { Timestamp } from "firebase/firestore";

export type GridStatus = "NORMAL" | "WARNING" | "ALERT";

export interface SystemStatus {
  current_status: GridStatus;
  total_plts_capacity_kw: number;
  total_pltd_capacity_kw: number;
  updated_at?: Timestamp;
  // Metadata tambahan dari pipeline ML (docs/FIRESTORE_CONTRACT.md).
  current_operating_status?: GridStatus; // status jam pertama -> badge "Kondisi Saat Ini"
  forecast_risk_status?: GridStatus; // status terburuk 48 jam -> badge "Risiko 48 Jam"
  critical_timestamp?: Timestamp;
  minimum_grid_margin_kw?: number;
  status_basis?: string;
  model_version?: string;
}

export interface PowerForecast {
  id: string; // doc id: YYYY-MM-DD_HH
  timestamp: Timestamp;
  predicted_plts_kw: number;
  projected_load_kw: number;
  cloud_cover_percent: number;
  ghi_radiation: number;
  deficit_flag: boolean;
}

export type OperatorRole = "admin_bumdes" | "teknisi_pltd";

export interface Operator {
  email: string;
  nama: string;
  aktif: boolean;
  role: OperatorRole;
}

export interface BUMDesReward {
  id: string; // uid
  user_id: string;
  nama_warga: string;
  nomor_hp: string;
  total_poin: number;
  status?: "Aktif" | "Baru" | "Pending" | "Nonaktif";
}

export interface RiwayatShift {
  id: string;
  jam_shift: string;
  poin_diperoleh: number;
  status_klaim: boolean;
  timestamp: Timestamp;
}

export interface RedemptionRequest {
  id: string;
  uid: string; // BUMDes_rewards doc id pemilik poin
  nama_warga: string;
  hadiah: string; // nama item tukar (voucher, sembako, dst)
  poin: number;
  status: "pending" | "approved" | "rejected";
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  target_topic: string;
  timestamp: Timestamp;
}

// ---------- Otomasi (Fase H) ----------

export type SessionStatus = "UPCOMING" | "ACTIVE" | "ENDED";

/**
 * Sesi Jam Emas (load_shift_sessions).
 *
 * Koleksi bersama dengan aplikasi mobile: tombol "kirim bukti" di HP warga
 * hanya menyala saat ada sesi berstatus ACTIVE. Web yang mengubah statusnya
 * tepat waktu lewat cron, dan menjadi acuan mesin verifikasi menilai foto.
 */
export interface LoadShiftSession {
  id: string;
  date: string; // "31 Juli 2026"
  startTime: string; // "10:00"
  endTime: string; // "15:00"
  status: SessionStatus;
  targetSavingKwh: number;
  capacityKw: number;
  currentLoadKw: number;
  participantCount: number;
  // Tambahan web (tidak dipakai mobile):
  poin_per_partisipasi?: number;
  dibuat_oleh?: string;
  /** Waktu mulai & selesai sesungguhnya — dipakai mesin verifikasi. */
  startAt?: Timestamp;
  endAt?: Timestamp;
}

/** Profil warga — ditulis aplikasi mobile saat mendaftar. */
export interface AppUser {
  uid: string;
  nama: string;
  email: string;
  phone: string;
  role: "WARGA";
}

export type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Bukti foto warga yang menggeser jam pemakaian listrik.
 * Nama field mengikuti skema aplikasi mobile (camelCase).
 *
 * Catatan: photosBase64 menyimpan foto langsung di dokumen Firestore, yang
 * dibatasi 1 MiB per dokumen. Foto wajib dikompres di sisi mobile — lihat
 * catatan di context.md.
 */
export interface ParticipationRequest {
  id: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  goldenHourRange?: string; // "10:00-14:00" — jendela yang diklaim warga
  photosBase64?: string[];
  status: ParticipationStatus;
  // Diisi mesin verifikasi:
  windowId?: string;
  poinDiberikan?: number;
  verifiedAt?: Timestamp;
  verificationReason?: string;
}

export type RewardIcon = "FLASH" | "SHOPPING" | "WATER";

export interface RewardCatalogItem {
  id: string;
  name: string;
  pointsRequired: number;
  iconType: RewardIcon;
  type: "DIGITAL";
  // Tambahan web (opsional bagi mobile):
  deskripsi?: string;
  aktif?: boolean;
}

/** Stok kode token. Koleksi: voucher_stock */
export interface VoucherStock {
  id: string;
  reward_id: string;
  code: string;
  is_used: boolean;
  used_by_uid?: string;
  used_at?: Timestamp;
}

export interface RedemptionHistoryItem {
  id: string;
  user_id: string;
  nama_warga: string;
  catalog_id: string;
  nama_hadiah: string;
  biaya_poin: number;
  kode_diberikan: string;
  timestamp: Timestamp;
}
