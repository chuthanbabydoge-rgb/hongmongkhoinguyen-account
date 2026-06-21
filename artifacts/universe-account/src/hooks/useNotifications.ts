import { useState, useEffect, useCallback, useRef } from "react";
import { Notification, NotificationSettings, NotificationCategory } from "@/lib/types/notification";
import {
  apiGetNotifications,
  apiGetUnreadCount,
  apiMarkRead,
  apiMarkAllRead,
  apiMarkCategoryRead,
  apiDeleteNotification,
  apiDeleteAll,
  apiGetSettings,
  apiSaveSettings,
  generateLiveNotification,
} from "@/lib/services/notificationService";
import { useAuth } from "./useAuth";

const REALTIME_INTERVAL_MS = 28000; // ~28 seconds

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [liveToast, setLiveToast] = useState<Notification | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [notifs, count] = await Promise.all([
      apiGetNotifications(user.id),
      apiGetUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, [user]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    Promise.all([apiGetNotifications(user.id), apiGetSettings(user.id)]).then(
      ([notifs, s]) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
        setSettings(s);
        setIsLoading(false);
      }
    );
  }, [user]);

  // Realtime simulation
  useEffect(() => {
    if (!user) return;
    intervalRef.current = setInterval(() => {
      const notif = generateLiveNotification(user.id);
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      setLiveToast(notif);
      setTimeout(() => setLiveToast(null), 5000);
    }, REALTIME_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  const markRead = useCallback(
    async (id: string) => {
      await apiMarkRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await apiMarkAllRead(user.id);
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }))
    );
    setUnreadCount(0);
  }, [user]);

  const markCategoryRead = useCallback(
    async (category: NotificationCategory) => {
      if (!user) return;
      await apiMarkCategoryRead(user.id, category);
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) =>
          n.category === category && !n.isRead ? { ...n, isRead: true, readAt: now } : n
        )
      );
      setUnreadCount((c) => {
        const catUnread = notifications.filter(
          (n) => n.category === category && !n.isRead
        ).length;
        return Math.max(0, c - catUnread);
      });
    },
    [user, notifications]
  );

  const deleteNotification = useCallback(async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    await apiDeleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  const deleteAll = useCallback(async () => {
    if (!user) return;
    await apiDeleteAll(user.id);
    setNotifications([]);
    setUnreadCount(0);
  }, [user]);

  const saveSettings = useCallback(async (s: NotificationSettings) => {
    await apiSaveSettings(s);
    setSettings(s);
  }, []);

  return {
    notifications,
    settings,
    unreadCount,
    isLoading,
    liveToast,
    markRead,
    markAllRead,
    markCategoryRead,
    deleteNotification,
    deleteAll,
    saveSettings,
    refresh,
  };
}
