import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

function safeStorageName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadServiceAttachments(serviceOrderId: string, files: File[]) {
  const uploads = await Promise.all(
    files
      .filter((file): file is File => file instanceof File)
      .map(async (file, index) => {
        const storageRef = ref(storage, `service-orders/${serviceOrderId}/attachments/${Date.now()}-${index}-${safeStorageName(file.name)}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
  );

  return uploads;
}
