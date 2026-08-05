// Login operator + cek allowlist Firestore (collection operators/{uid}).
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Operator } from "./types";

export async function fetchOperator(uid: string): Promise<Operator | null> {
  const snap = await getDoc(doc(db, "operators", uid));
  return snap.exists() ? (snap.data() as Operator) : null;
}

/** Login + validasi allowlist. Kalau bukan operator aktif -> sign out + error. */
export async function loginOperator(
  email: string,
  password: string,
): Promise<{ uid: string; operator: Operator }> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const operator = await fetchOperator(cred.user.uid);
  if (!operator || !operator.aktif) {
    await signOut(auth);
    throw new Error("Akses ditolak. Akun ini bukan operator aktif.");
  }
  return { uid: cred.user.uid, operator };
}
