export type InternalNotification = {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
};
