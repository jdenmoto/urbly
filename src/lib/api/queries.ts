import { useQuery } from '@tanstack/react-query';
import { listDocs } from './firestore';

export function useList<T>(key: string, path: string) {
  return useQuery({
    queryKey: [key],
    queryFn: () => listDocs<T>(path)
  });
}
