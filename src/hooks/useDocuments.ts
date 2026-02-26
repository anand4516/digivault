import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentFile } from "@/types/document";

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setDocuments([]); setLoading(false); return; }
    const q = query(collection(db, "users", user.uid, "documents"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentFile)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const addDocument = async (docData: Omit<DocumentFile, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "documents"), docData);
  };

  const updateDocument = async (id: string, data: Partial<DocumentFile>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "documents", id), { ...data, updatedAt: new Date().toISOString() });
  };

  const removeDocument = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "documents", id));
  };

  return { documents, loading, addDocument, updateDocument, removeDocument };
};
