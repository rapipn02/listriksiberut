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
