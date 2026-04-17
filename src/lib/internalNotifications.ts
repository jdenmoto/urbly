import { createDoc, updateDocById } from '@/lib/api/firestore';
import type { InternalNotification } from '@/core/models/internalNotification';

export async function createInternalNotification(input: Omit<InternalNotification, 'id' | 'createdAt' | 'read'>) {
  return createDoc('internal_notifications', {
    ...input,
    read: false,
    createdAt: new Date().toISOString()
  });
}

export async function markInternalNotificationRead(id: string) {
  return updateDocById('internal_notifications', id, { read: true });
}
