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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { WalletCard } from "@/types/wallet";

export const useWalletCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "walletCards"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletCard));
        setCards(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [user]);

  const addCard = async (card: Omit<WalletCard, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "walletCards"), card);
  };

  const updateCard = async (id: string, data: Partial<WalletCard>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "walletCards", id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const removeCard = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "walletCards", id));
  };

  return { cards, loading, addCard, updateCard, removeCard };
};
