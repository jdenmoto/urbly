import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

export const db = getFirestore();
export const authAdmin = getAuth();
export { FieldValue };
