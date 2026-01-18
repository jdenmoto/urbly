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
