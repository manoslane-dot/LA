export interface NotificationItem {
  id: string;
  title: string;
  status: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const getNotificationStorageKey = (userKey: string | null | undefined) => {
  const normalizedKey = (userKey ?? 'guest').trim();
  return `agrodirect-notifications:${normalizedKey || 'guest'}`;
};

export const loadNotifications = (storageKey: string): NotificationItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (storageKey: string, notifications: NotificationItem[]) => {
  if (typeof window === 'undefined') {
    return notifications;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(notifications));
  return notifications;
};

export const addNotification = (
  storageKey: string,
  notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
) => {
  const nextNotification: NotificationItem = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const notifications = [nextNotification, ...loadNotifications(storageKey)];
  return saveNotifications(storageKey, notifications);
};

export const markNotificationsRead = (storageKey: string, notificationIds?: string[]) => {
  const notifications = loadNotifications(storageKey).map((notification) => {
    if (notificationIds && notificationIds.length > 0 && !notificationIds.includes(notification.id)) {
      return notification;
    }

    return { ...notification, read: true };
  });

  return saveNotifications(storageKey, notifications);
};

export const getUnreadNotificationCount = (notifications: NotificationItem[]) =>
  notifications.filter((notification) => !notification.read).length;
