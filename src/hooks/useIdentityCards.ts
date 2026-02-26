import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { IdentityCard } from "@/types/identity";

export const useIdentityCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<IdentityCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCards([]); setLoading(false); return; }
    const q = query(collection(db, "users", user.uid, "identityCards"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q,
      (snap) => { setCards(snap.docs.map((d) => ({ id: d.id, ...d.data() } as IdentityCard))); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const addCard = async (card: Omit<IdentityCard, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "identityCards"), card);
  };

  const updateCard = async (id: string, data: Partial<IdentityCard>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "identityCards", id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeCard = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "identityCards", id));
  };

  return { cards, loading, addCard, updateCard, removeCard };
};
