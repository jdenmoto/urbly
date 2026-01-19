import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { functions } from '@/lib/firebase/functions';
import { storage } from '@/lib/firebase/client';

export type ImportResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

export async function importBuildingsFile(file: File) {
  const storageRef = ref(storage, `imports/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  const callable = httpsCallable(functions, 'importBuildings');
  const response = await callable({ downloadUrl, fileName: file.name });
  return response.data as ImportResult;
}

export async function createAppUser(email: string, role: string) {
  const callable = httpsCallable(functions, 'createUser');
  const response = await callable({ email, role });
  return response.data as { uid: string; password: string };
}

export async function updateAppUser(uid: string, payload: { email?: string; role?: string }) {
  const callable = httpsCallable(functions, 'updateUser');
  const response = await callable({ uid, ...payload });
  return response.data as { ok: boolean };
}

export async function setAppUserDisabled(uid: string, disabled: boolean) {
  const callable = httpsCallable(functions, 'setUserDisabled');
  const response = await callable({ uid, disabled });
  return response.data as { ok: boolean };
}

export async function deleteAppUser(uid: string) {
  const callable = httpsCallable(functions, 'deleteUser');
  const response = await callable({ uid });
  return response.data as { ok: boolean };
}
