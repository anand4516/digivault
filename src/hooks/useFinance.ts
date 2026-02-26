import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/types/finance";

export const useFinance = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<{ income: string[]; expense: string[] }>({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTransactions([]); setLoading(false); return; }

    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
      setLoading(false);
    }, () => setLoading(false));

    const stored = localStorage.getItem(`cv-categories-${user.uid}`);
    if (stored) setCustomCategories(JSON.parse(stored));

    return unsub;
  }, [user]);

  const saveCustomCategories = (updated: { income: string[]; expense: string[] }) => {
    if (!user) return;
    setCustomCategories(updated);
    localStorage.setItem(`cv-categories-${user.uid}`, JSON.stringify(updated));
  };

  const addTransaction = async (t: Omit<Transaction, "id" | "createdAt">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "transactions"), { ...t, createdAt: new Date().toISOString() });
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "transactions", id), data);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  };

  const addCustomCategory = (type: "income" | "expense", category: string) => {
    const updated = { ...customCategories, [type]: [...customCategories[type], category] };
    saveCustomCategories(updated);
  };

  const deleteCustomCategory = (type: "income" | "expense", category: string) => {
    const updated = { ...customCategories, [type]: customCategories[type].filter((c) => c !== category) };
    saveCustomCategories(updated);
  };

  const editCustomCategory = (type: "income" | "expense", oldName: string, newName: string) => {
    const updated = { ...customCategories, [type]: customCategories[type].map((c) => c === oldName ? newName : c) };
    saveCustomCategories(updated);
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, customCategories, addCustomCategory, deleteCustomCategory, editCustomCategory };
};
