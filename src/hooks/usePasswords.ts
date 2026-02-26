import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordEntry } from "@/types/password";

// Simple obfuscation (NOT true encryption - for demo purposes)
const encode = (s: string) => btoa(encodeURIComponent(s));
const decode = (s: string) => { try { return decodeURIComponent(atob(s)); } catch { return s; } };

export const usePasswords = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPasswords([]); setLoading(false); return; }

    const q = query(collection(db, "users", user.uid, "passwords"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPasswords(snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, password: decode(data.password || "") } as PasswordEntry;
      }));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const addPassword = async (p: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, "users", user.uid, "passwords"), {
      ...p, password: encode(p.password), createdAt: now, updatedAt: now,
    });
  };

  const updatePassword = async (id: string, data: Partial<PasswordEntry>) => {
    if (!user) return;
    const update: any = { ...data, updatedAt: new Date().toISOString() };
    if (data.password) update.password = encode(data.password);
    await updateDoc(doc(db, "users", user.uid, "passwords", id), update);
  };

  const deletePassword = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "passwords", id));
  };

  return { passwords, loading, addPassword, updatePassword, deletePassword };
};
