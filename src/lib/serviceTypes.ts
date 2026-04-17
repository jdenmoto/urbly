import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { appointmentTypeOptions } from '@/core/appointments';
import type { ServiceTypeRecord } from '@/features/settings/ServiceTypesSettingsPage';

export async function listServiceTypes(): Promise<ServiceTypeRecord[]> {
  try {
    const snapshot = await getDoc(doc(db, 'settings', 'service_types'));
    if (snapshot.exists()) {
      const payload = snapshot.data() as { types?: ServiceTypeRecord[] };
      const active = (payload.types ?? []).filter((item) => item.active !== false);
      if (active.length > 0) return active;
    }
  } catch {
    // fallback below
  }

  return appointmentTypeOptions.map((code) => ({
    id: code,
    code,
    name: code,
    active: true,
    defaultDurationMinutes: 60,
    category: ''
  }));
}
