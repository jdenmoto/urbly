import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  doc,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function createDoc<T extends Record<string, unknown>>(path: string, data: T) {
  return addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
}

export async function updateDocById<T extends Record<string, unknown>>(path: string, id: string, data: T) {
  return updateDoc(doc(db, path, id), data);
}

export async function listDocs<T>(path: string, constraints: QueryConstraint[] = []) {
  const snapshot = await getDocs(query(collection(db, path), ...constraints));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as T & { id: string });
}

export function filters() {
  return {
    where,
    orderBy,
    limit
  };
}
