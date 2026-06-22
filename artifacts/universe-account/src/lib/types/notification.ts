export type NotificationCategory =
  | "system"
  | "security"
  | "marketplace"
  | "rewards"
  | "social"
  | "world_events";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationType = "info" | "success" | "warning" | "error" | "announcement";

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  isRead: boolean;
  isDeleted: boolean;
  actionLabel?: string;
  actionUrl?: string;
  iconOverride?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationSettings {
  userId: string;
  categories: Record<NotificationCategory, { enabled: boolean; push: boolean; sound: boolean }>;
  globalSound: boolean;
  globalPush: boolean;
  doNotDisturb: boolean;
  dndFrom?: string;
  dndTo?: string;
}

export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: string; color: string; text: string; bg: string; border: string; gradient: string }
> = {
  system: {
    label: "Hệ Thống",
    icon: "⚙️",
    color: "text-slate-300",
    text: "text-slate-200",
    bg: "bg-slate-500/10",
    border: "border-slate-400/25",
    gradient: "from-slate-400/15 to-slate-600/8",
  },
  security: {
    label: "Bảo Mật",
    icon: "🛡️",
    color: "text-cyan-300",
    text: "text-cyan-200",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    gradient: "from-cyan-400/15 to-blue-600/8",
  },
  marketplace: {
    label: "Chợ Trực Tuyến",
    icon: "💱",
    color: "text-emerald-300",
    text: "text-emerald-200",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    gradient: "from-emerald-400/15 to-teal-600/8",
  },
  rewards: {
    label: "Phần Thưởng",
    icon: "🎁",
    color: "text-amber-300",
    text: "text-amber-200",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    gradient: "from-amber-400/15 to-orange-600/8",
  },
  social: {
    label: "Mạng Xã Hội",
    icon: "🌐",
    color: "text-violet-300",
    text: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    gradient: "from-violet-400/15 to-purple-600/8",
  },
  world_events: {
    label: "Sự Kiện Thế Giới",
    icon: "🌍",
    color: "text-blue-300",
    text: "text-blue-200",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    gradient: "from-blue-400/15 to-indigo-600/8",
  },
};

export const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; dot: string; ring: string; badge: string }
> = {
  low: { label: "Thấp", dot: "bg-white/20", ring: "", badge: "bg-white/8 text-white/25" },
  medium: { label: "Trung bình", dot: "bg-amber-400", ring: "", badge: "bg-amber-500/15 text-amber-300" },
  high: { label: "Cao", dot: "bg-orange-400", ring: "ring-1 ring-orange-400/40", badge: "bg-orange-500/15 text-orange-300" },
  urgent: { label: "Khẩn cấp", dot: "bg-red-400 animate-pulse", ring: "ring-1 ring-red-400/50", badge: "bg-red-500/15 text-red-300" },
};

export const TYPE_META: Record<NotificationType, { icon: string; label: string; color: string }> = {
  info: { icon: "ℹ️", label: "Thông tin", color: "text-blue-300" },
  success: { icon: "✅", label: "Thành công", color: "text-emerald-300" },
  warning: { icon: "⚠️", label: "Cảnh báo", color: "text-amber-300" },
  error: { icon: "🔴", label: "Lỗi", color: "text-red-300" },
  announcement: { icon: "📢", label: "Thông báo", color: "text-violet-300" },
};
