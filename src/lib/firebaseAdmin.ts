// Firebase Admin SDK — SERVER-SIDE SAJA (Route Handler).
// Jangan pernah import dari client component.
//
// Kredensial dibaca dari env FIREBASE_SERVICE_ACCOUNT_JSON (isi JSON satu baris),
// dengan fallback ke file serviceAccountKey.json saat development lokal.
// Pola env dipakai agar build standalone di VPS tidak perlu menyertakan file kunci.
import { readFileSync, existsSync } from "node:fs";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw) as ServiceAccount;
    } catch {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON valid.");
      return null;
    }
  }
  // Fallback development: file lokal (tidak ikut ke repo, ada di .gitignore).
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "./serviceAccountKey.json";
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
    } catch {
      console.error(`Gagal membaca service account di ${path}.`);
      return null;
    }
  }
  return null;
}

let cached: { app: App; db: Firestore; messaging: Messaging } | null = null;

/** Kembalikan handle admin, atau null kalau kredensial belum dikonfigurasi (mode demo). */
export function getAdmin() {
  if (cached) return cached;

  const sa = loadServiceAccount();
  if (!sa) return null;

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key.replace(/\\n/g, "\n"),
        }),
      });

  cached = { app, db: getFirestore(app), messaging: getMessaging(app) };
  return cached;
}

export const FCM_TOPIC = process.env.FCM_TOPIC ?? "WARGA";
