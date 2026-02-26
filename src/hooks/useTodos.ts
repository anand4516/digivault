import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Todo } from "@/types/todo";

export const useTodos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTodos([]); setLoading(false); return; }

    const q = query(collection(db, "users", user.uid, "todos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Todo)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const addTodo = async (t: Omit<Todo, "id" | "createdAt" | "updatedAt">) => {
    if (!user) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, "users", user.uid, "todos"), { ...t, createdAt: now, updatedAt: now });
  };

  const updateTodo = async (id: string, data: Partial<Todo>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "todos", id), { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "todos", id));
  };

  return { todos, loading, addTodo, updateTodo, deleteTodo };
};
