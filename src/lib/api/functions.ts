import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { functions } from '@/lib/firebase/functions';
import { storage } from '@/lib/firebase/client';

export type ImportResult = {
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  entity?: string;
  dryRun?: boolean;
  previewCount?: number;
  validRows?: number;
  summaryMessage?: string;
};

export async function importBuildingsFile(file: File, options?: { dryRun?: boolean }) {
  const storageRef = ref(storage, `imports/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  const callable = httpsCallable(functions, 'importBuildings');
  const response = await callable({ downloadUrl, fileName: file.name, dryRun: options?.dryRun ?? false });
  return response.data as ImportResult;
}

export async function createAppUser(email: string, role: string, administrationId: string | null) {
  const callable = httpsCallable(functions, 'createUser');
  const response = await callable({ email, role, administrationId });
  return response.data as { uid: string; password: string };
}

export async function updateAppUser(
  uid: string,
  payload: { email?: string; role?: string; administrationId?: string | null }
) {
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

export async function generateAppointmentsPdf(params: {
  buildingId: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const callable = httpsCallable(functions, 'generateAppointmentsPdf');
  const response = await callable(params);
  return response.data as { filename: string; contentBase64: string };
}

export async function generateServiceReportPdf(params: { serviceOrderId: string }) {
  const callable = httpsCallable(functions, 'generateServiceReportPdf');
  const response = await callable(params);
  return response.data as { filename: string; contentBase64: string };
}


export async function generateClientPortalToken(params: { serviceOrderId: string; customerId: string }) {
  const fn = httpsCallable(functions, 'generateClientPortalToken');
  const result = await fn(params);
  return result.data as { token: string };
}

export async function validateClientPortalToken(params: { token: string }) {
  const fn = httpsCallable(functions, 'validateClientPortalToken');
  const result = await fn(params);
  return result.data as { valid: boolean; serviceOrderId: string; customerId: string; serviceOrder: { title: string; status: string } };
}
