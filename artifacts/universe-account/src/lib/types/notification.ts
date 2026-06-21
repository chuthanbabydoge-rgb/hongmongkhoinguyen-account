export type NotificationCategory =
  | "system"
  | "identity"
  | "safepass"
  | "football"
  | "animals"
  | "worlds"
  | "exchange";

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
  dndFrom?: string; // "HH:MM"
  dndTo?: string;
}

export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: string; color: string; text: string; bg: string; border: string; gradient: string }
> = {
  system: {
    label: "System",
    icon: "⚙️",
    color: "text-slate-300",
    text: "text-slate-200",
    bg: "bg-slate-500/10",
    border: "border-slate-400/25",
    gradient: "from-slate-400/15 to-slate-600/8",
  },
  identity: {
    label: "Identity",
    icon: "🪪",
    color: "text-violet-300",
    text: "text-violet-200",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    gradient: "from-violet-400/15 to-purple-600/8",
  },
  safepass: {
    label: "SafePass",
    icon: "🛡️",
    color: "text-cyan-300",
    text: "text-cyan-200",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    gradient: "from-cyan-400/15 to-blue-600/8",
  },
  football: {
    label: "Football Universe",
    icon: "⚽",
    color: "text-emerald-300",
    text: "text-emerald-200",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    gradient: "from-emerald-400/15 to-teal-600/8",
  },
  animals: {
    label: "Animal Evolution",
    icon: "🧬",
    color: "text-amber-300",
    text: "text-amber-200",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    gradient: "from-amber-400/15 to-orange-600/8",
  },
  worlds: {
    label: "World Creator",
    icon: "🌍",
    color: "text-blue-300",
    text: "text-blue-200",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    gradient: "from-blue-400/15 to-indigo-600/8",
  },
  exchange: {
    label: "Exchange Hub",
    icon: "💱",
    color: "text-rose-300",
    text: "text-rose-200",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    gradient: "from-rose-400/15 to-pink-600/8",
  },
};

export const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; dot: string; ring: string }
> = {
  low: { label: "Low", dot: "bg-white/20", ring: "" },
  medium: { label: "Medium", dot: "bg-amber-400", ring: "" },
  high: { label: "High", dot: "bg-orange-400", ring: "ring-1 ring-orange-400/40" },
  urgent: { label: "Urgent", dot: "bg-red-400 animate-pulse", ring: "ring-1 ring-red-400/50" },
};

export const TYPE_ICON: Record<NotificationType, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "🔴",
  announcement: "📢",
};
