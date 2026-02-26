import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { BankDetail } from "@/types/bank";

export const useBankDetails = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setBanks([]); setLoading(false); return; }
    const q = query(collection(db, "users", user.uid, "bankDetails"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q,
      (snap) => { setBanks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BankDetail))); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const addBank = async (bank: Omit<BankDetail, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "bankDetails"), bank);
  };

  const updateBank = async (id: string, data: Partial<BankDetail>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "bankDetails", id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeBank = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "bankDetails", id));
  };

  return { banks, loading, addBank, updateBank, removeBank };
};
