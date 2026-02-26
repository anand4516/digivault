import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessCard } from "@/types/card";

export const useCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "cards"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BusinessCard));
      setCards(data);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [user]);

  const addCard = async (card: Omit<BusinessCard, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "cards"), card);
    // Update stats
    const statsRef = doc(db, "users", user.uid, "stats", "main");
    await updateDoc(statsRef, { totalCards: increment(1) }).catch(() => {});
  };

  const updateCard = async (id: string, data: Partial<BusinessCard>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "cards", id), { ...data, updatedAt: new Date().toISOString() });
  };

  const removeCard = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cards", id));
    const statsRef = doc(db, "users", user.uid, "stats", "main");
    await updateDoc(statsRef, { totalCards: increment(-1) }).catch(() => {});
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await updateCard(id, { favorite: !current });
  };

  return { cards, loading, addCard, updateCard, removeCard, toggleFavorite };
};
