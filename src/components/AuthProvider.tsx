"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { fetchOperator, loginOperator } from "@/lib/auth";
import type { OperatorRole } from "@/lib/types";

export interface Session {
  uid: string;
  email: string;
  nama: string;
  role: OperatorRole;
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  loginReal: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const op = await fetchOperator(user.uid);
        if (op && op.aktif) {
          setSession({
            uid: user.uid,
            email: op.email,
            nama: op.nama,
            role: op.role,
          });
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginReal = async (email: string, password: string) => {
    const { uid, operator } = await loginOperator(email, password);
    setSession({
      uid,
      email: operator.email,
      nama: operator.nama,
      role: operator.role,
    });
  };

  const logout = async () => {
    if (isFirebaseConfigured) await signOut(auth);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, loginReal, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus di dalam <AuthProvider>");
  return ctx;
}
