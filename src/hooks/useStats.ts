import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface Stats {
  totalCards: number;
  callsMade: number;
  whatsappSent: number;
  emailsSent: number;
}

export const useStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalCards: 0, callsMade: 0, whatsappSent: 0, emailsSent: 0 });

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "stats", "main"), (snap) => {
      if (snap.exists()) setStats(snap.data() as Stats);
    });
    return unsub;
  }, [user]);

  return stats;
};
