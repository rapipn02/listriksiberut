import type { Timestamp } from "firebase/firestore";

export type GridStatus = "NORMAL" | "WARNING" | "ALERT";

export interface SystemStatus {
  current_status: GridStatus;
  total_plts_capacity_kw: number;
  total_pltd_capacity_kw: number;
  updated_at?: Timestamp;

  current_operating_status?: GridStatus;
  forecast_risk_status?: GridStatus;
  critical_timestamp?: Timestamp;
  minimum_grid_margin_kw?: number;
  status_basis?: string;
  model_version?: string;
}

export interface PowerForecast {
  id: string;
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
  id: string;
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
  uid: string;
  nama_warga: string;
  hadiah: string;
  poin: number;
  status: "pending" | "approved" | "rejected";
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  target_topic: string;
  timestamp: Timestamp;
  dibuat_oleh?: string;
}

export type SessionStatus = "UPCOMING" | "ACTIVE" | "ENDED";

export interface LoadShiftSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  targetSavingKwh: number;
  capacityKw: number;
  currentLoadKw: number;
  participantCount: number;

  poin_per_partisipasi?: number;
  dibuat_oleh?: string;

  startAt?: Timestamp;
  endAt?: Timestamp;
}

export interface AppUser {
  uid: string;
  nama: string;
  email: string;
  phone: string;
  role: "WARGA";
}

export type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ParticipationRequest {
  id: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  goldenHourRange?: string;
  photosBase64?: string[];
  status: ParticipationStatus;

  windowId?: string;
  poinDiberikan?: number;
  verifiedAt?: Timestamp;
  verificationReason?: string;
  verificationCode?: string;
  photoHashes?: string[];
}

export type RewardIcon = "FLASH" | "SHOPPING" | "WATER";

export interface RewardCatalogItem {
  id: string;
  name: string;
  pointsRequired: number;
  iconType: RewardIcon;
  type: "DIGITAL";

  deskripsi?: string;
  aktif?: boolean;
}

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
