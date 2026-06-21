import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Notification,
  NotificationCategory,
  NotificationSettings,
  CATEGORY_META,
  PRIORITY_META,
} from "@/lib/types/notification";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Trash,
  Settings2,
  X,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Moon,
  ChevronRight,
  Loader2,
  Filter,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const rowVariant = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: 16, scale: 0.97, transition: { duration: 0.18 } },
};

// ── Live Toast ─────────────────────────────────────────────────────────────

function LiveToast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const meta = CATEGORY_META[notif.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full rounded-2xl border p-4 shadow-2xl",
        "bg-[#0a1628]/95 backdrop-blur-xl",
        meta.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border", meta.bg, meta.border)}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", meta.color)}>{meta.label}</span>
            <Zap className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">Live</span>
          </div>
          <p className="text-white/90 text-sm font-semibold leading-snug">{notif.title}</p>
          <p className="text-white/45 text-xs mt-0.5 line-clamp-2">{notif.body}</p>
        </div>
        <button onClick={onDismiss} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Notification Row ──────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[notif.category];
  const priority = PRIORITY_META[notif.priority];

  return (
    <motion.div
      layout
      variants={rowVariant}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "rounded-xl border transition-all group",
        notif.isRead
          ? "bg-white/2 border-white/6"
          : `bg-gradient-to-r ${meta.gradient} ${meta.border} shadow-sm`
      )}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => {
          setExpanded((v) => !v);
          if (!notif.isRead) onMarkRead(notif.id);
        }}
      >
        {/* Category icon */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border transition-all",
          notif.isRead ? "bg-white/5 border-white/10 opacity-60" : `${meta.bg} ${meta.border}`
        )}>
          {meta.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", notif.isRead ? "text-white/25" : meta.color)}>
              {meta.label}
            </span>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priority.dot, priority.ring)} />
            {!notif.isRead && (
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 shadow-[0_0_4px_rgba(124,58,237,0.8)]" />
            )}
          </div>
          <p className={cn("text-sm font-semibold leading-snug", notif.isRead ? "text-white/50" : "text-white/90")}>
            {notif.title}
          </p>
          <p className={cn("text-xs leading-relaxed", notif.isRead ? "text-white/25" : "text-white/45", expanded ? "" : "line-clamp-1")}>
            {notif.body}
          </p>
        </div>

        {/* Meta + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0 ml-1">
          <span className="text-white/20 text-[10px] whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.isRead && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                title="Mark as read"
                className="w-6 h-6 rounded-md bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center transition-all"
              >
                <Check className="w-3 h-3 text-white/40 hover:text-emerald-400" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
              title="Delete"
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all"
            >
              <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400" />
            </button>
          </div>
          <ChevronRight className={cn("w-3 h-3 text-white/15 transition-transform", expanded && "rotate-90")} />
        </div>
      </div>

      {/* Expanded action */}
      <AnimatePresence>
        {expanded && notif.actionLabel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/6">
              <button className={cn(
                "mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                meta.bg, meta.border, meta.text,
                "hover:brightness-125"
              )}>
                {notif.actionLabel}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Category Sidebar ──────────────────────────────────────────────────────────

function CategorySidebar({
  notifications,
  selected,
  onChange,
  onMarkCategoryRead,
}: {
  notifications: Notification[];
  selected: NotificationCategory | "all";
  onChange: (c: NotificationCategory | "all") => void;
  onMarkCategoryRead: (c: NotificationCategory) => void;
}) {
  const allUnread = notifications.filter((n) => !n.isRead).length;
  const cats: (NotificationCategory | "all")[] = [
    "all", "system", "identity", "safepass", "football", "animals", "worlds", "exchange",
  ];

  return (
    <div className="space-y-1">
      {cats.map((cat) => {
        const isAll = cat === "all";
        const meta = isAll ? null : CATEGORY_META[cat];
        const unread = isAll
          ? allUnread
          : notifications.filter((n) => n.category === cat && !n.isRead).length;
        const total = isAll
          ? notifications.length
          : notifications.filter((n) => n.category === cat).length;
        const isActive = selected === cat;

        return (
          <div key={cat} className="group/cat relative">
            <button
              onClick={() => onChange(cat)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                isActive
                  ? isAll
                    ? "bg-violet-600/20 border border-violet-500/30 text-violet-200"
                    : `${meta!.bg} border ${meta!.border} ${meta!.text}`
                  : "hover:bg-white/5 border border-transparent text-white/40 hover:text-white/70"
              )}
            >
              <span className="text-base shrink-0">{isAll ? "🔔" : meta!.icon}</span>
              <span className="text-xs font-medium flex-1 truncate">
                {isAll ? "All Notifications" : meta!.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {unread > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center",
                    isAll ? "bg-violet-500/40 text-violet-200" : `${meta!.bg} ${meta!.color}`
                  )}>
                    {unread}
                  </span>
                )}
                <span className="text-[9px] text-white/20">{total}</span>
              </div>
            </button>
            {!isAll && unread > 0 && isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkCategoryRead(cat); }}
                title="Mark all in category as read"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity w-5 h-5 rounded-md bg-white/10 flex items-center justify-center"
              >
                <CheckCheck className="w-3 h-3 text-white/50" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({
  settings,
  onSave,
  onClose,
}: {
  settings: NotificationSettings;
  onSave: (s: NotificationSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<NotificationSettings>(settings);
  const cats = Object.keys(CATEGORY_META) as NotificationCategory[];

  const toggle = (path: string[]) => {
    setLocal((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as NotificationSettings;
      if (path.length === 1) {
        const k = path[0] as keyof NotificationSettings;
        (next[k] as boolean) = !(next[k] as boolean);
      } else {
        const cat = path[0] as NotificationCategory;
        const key = path[1] as "enabled" | "push" | "sound";
        next.categories[cat][key] = !next.categories[cat][key];
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-white/40" />
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Notification Settings</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Global toggles */}
      <GlassCard>
        <div className="p-4 space-y-3">
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Global</p>
          {[
            { key: "globalSound", icon: <Volume2 className="w-4 h-4" />, label: "Notification Sounds" },
            { key: "globalPush", icon: <Smartphone className="w-4 h-4" />, label: "Push Notifications" },
            { key: "doNotDisturb", icon: <Moon className="w-4 h-4" />, label: "Do Not Disturb" },
          ].map((item) => {
            const val = local[item.key as keyof NotificationSettings] as boolean;
            return (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-white/50">
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
                <button
                  onClick={() => toggle([item.key])}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    val ? "bg-violet-600" : "bg-white/10"
                  )}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", val ? "left-5.5" : "left-0.5")} />
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Per-category */}
      <GlassCard>
        <div className="p-4 space-y-3">
          <p className="text-white/30 text-[10px] uppercase tracking-widest">Per Category</p>
          <div className="grid grid-cols-3 gap-1 text-[9px] text-white/25 uppercase tracking-wider pb-1 border-b border-white/6">
            <span>Category</span>
            <span className="text-center">Enabled</span>
            <span className="text-center">Sound</span>
          </div>
          {cats.map((cat) => {
            const meta = CATEGORY_META[cat];
            const catSettings = local.categories[cat];
            return (
              <div key={cat} className="grid grid-cols-3 gap-1 items-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{meta.icon}</span>
                  <span className="text-xs text-white/50 truncate">{meta.label}</span>
                </div>
                {(["enabled", "sound"] as const).map((key) => {
                  const val = catSettings[key];
                  return (
                    <div key={key} className="flex justify-center">
                      <button
                        onClick={() => toggle([cat, key])}
                        className={cn(
                          "w-8 h-4 rounded-full transition-all relative",
                          val ? "bg-violet-600/70" : "bg-white/8"
                        )}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all", val ? "left-4" : "left-0.5")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <button
        onClick={() => { onSave(local); onClose(); }}
        className="w-full py-2.5 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-200 text-sm font-semibold hover:bg-violet-600/50 transition-all"
      >
        Save Settings
      </button>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type SortMode = "newest" | "unread" | "priority";

export default function NotificationsPage() {
  const { toast } = useToast();
  const {
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
  } = useNotifications();

  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [showSettings, setShowSettings] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [liveToastVisible, setLiveToastVisible] = useState<Notification | null>(null);

  useEffect(() => {
    if (liveToast) setLiveToastVisible(liveToast);
  }, [liveToast]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast({ title: "All notifications marked as read" });
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    toast({ title: "All notifications cleared" });
  };

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  const filtered = notifications
    .filter((n) => category === "all" || n.category === category)
    .filter((n) => !showUnreadOnly || !n.isRead)
    .sort((a, b) => {
      if (sort === "unread") return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
      if (sort === "priority") return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categoryUnread = (cat: NotificationCategory | "all") =>
    cat === "all"
      ? unreadCount
      : notifications.filter((n) => n.category === cat && !n.isRead).length;

  if (isLoading) {
    return (
      <AppShell title="Notifications" subtitle="Stay updated across all your universes">
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Notifications" subtitle="Stay updated across all your universes">
      {/* Live toast */}
      <AnimatePresence>
        {liveToastVisible && (
          <LiveToast
            notif={liveToastVisible}
            onDismiss={() => setLiveToastVisible(null)}
          />
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 max-w-7xl">
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-400" />
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 text-[10px] font-semibold">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                showUnreadOnly
                  ? "bg-violet-600/20 border-violet-500/30 text-violet-200"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
              )}
            >
              <Filter className="w-3 h-3" />
              Unread only
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs transition-all"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/25 text-white/40 hover:text-red-400 text-xs transition-all"
              >
                <Trash className="w-3 h-3" />
                Clear all
              </button>
            )}
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                showSettings
                  ? "bg-violet-600/20 border-violet-500/30 text-violet-200"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
              )}
            >
              <Settings2 className="w-3 h-3" />
              Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr_280px] gap-5">
          {/* ── Category sidebar ── */}
          <div className="space-y-2">
            <GlassCard>
              <div className="p-3">
                <CategorySidebar
                  notifications={notifications}
                  selected={category}
                  onChange={setCategory}
                  onMarkCategoryRead={markCategoryRead}
                />
              </div>
            </GlassCard>

            {/* Sort */}
            <GlassCard>
              <div className="p-3 space-y-1">
                <p className="text-white/25 text-[9px] uppercase tracking-widest px-1 mb-2">Sort by</p>
                {([
                  { key: "newest", label: "Newest first", icon: <Clock className="w-3.5 h-3.5" /> },
                  { key: "unread", label: "Unread first", icon: <Bell className="w-3.5 h-3.5" /> },
                  { key: "priority", label: "By priority", icon: <Zap className="w-3.5 h-3.5" /> },
                ] as { key: SortMode; label: string; icon: React.ReactNode }[]).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left",
                      sort === s.key
                        ? "bg-violet-600/20 text-violet-200 border border-violet-500/25"
                        : "text-white/35 hover:text-white/60 hover:bg-white/5"
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* ── Main feed ── */}
          <div className="space-y-2.5 min-w-0">
            {/* Category header */}
            {category !== "all" && (
              <div className={cn(
                "flex items-center justify-between px-4 py-2.5 rounded-xl border",
                CATEGORY_META[category].bg, CATEGORY_META[category].border
              )}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{CATEGORY_META[category].icon}</span>
                  <div>
                    <p className={cn("text-sm font-semibold", CATEGORY_META[category].color)}>{CATEGORY_META[category].label}</p>
                    <p className="text-white/30 text-[10px]">{filtered.length} notifications · {categoryUnread(category)} unread</p>
                  </div>
                </div>
                {categoryUnread(category) > 0 && (
                  <button
                    onClick={() => markCategoryRead(category)}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark read
                  </button>
                )}
              </div>
            )}

            {/* Feed */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BellOff className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-white/30 text-sm font-medium">No notifications</p>
                <p className="text-white/15 text-xs mt-1">
                  {showUnreadOnly ? "No unread notifications in this category" : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((notif) => (
                    <NotifRow
                      key={notif.id}
                      notif={notif}
                      onMarkRead={markRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ── Settings panel (xl only) or inline on smaller ── */}
          <div className="hidden xl:block">
            <AnimatePresence mode="wait">
              {showSettings && settings ? (
                <SettingsPanel
                  key="settings"
                  settings={settings}
                  onSave={async (s) => {
                    await saveSettings(s);
                    toast({ title: "Settings saved" });
                  }}
                  onClose={() => setShowSettings(false)}
                />
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Quick stats */}
                  <GlassCard>
                    <div className="p-4 space-y-3">
                      <p className="text-white/30 text-[10px] uppercase tracking-widest">Overview</p>
                      {[
                        { label: "Total", value: notifications.length, color: "text-white" },
                        { label: "Unread", value: unreadCount, color: "text-violet-300" },
                        { label: "Read", value: notifications.filter((n) => n.isRead).length, color: "text-white/40" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                          <span className="text-white/40 text-xs">{s.label}</span>
                          <span className={cn("text-sm font-bold tabular-nums", s.color)}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Category breakdown */}
                  <GlassCard>
                    <div className="p-4 space-y-2">
                      <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">By Category</p>
                      {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => {
                        const total = notifications.filter((n) => n.category === cat).length;
                        const unread = notifications.filter((n) => n.category === cat && !n.isRead).length;
                        if (total === 0) return null;
                        const meta = CATEGORY_META[cat];
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <span className="text-sm shrink-0">{meta.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-white/45 text-[10px] truncate">{meta.label}</span>
                                <span className="text-white/30 text-[10px]">{total}</span>
                              </div>
                              <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", meta.bg.replace("/10", "/60"))}
                                  style={{ width: `${notifications.length > 0 ? (total / notifications.length) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            {unread > 0 && (
                              <span className={cn("text-[9px] font-bold px-1 rounded shrink-0", meta.color)}>{unread}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings toggle button when panel is not shown */}
            {!showSettings && (
              <button
                onClick={() => setShowSettings(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-white/35 hover:text-white/60 text-xs transition-all"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Notification Settings
              </button>
            )}
          </div>

          {/* Settings panel for smaller screens — full width below */}
          {showSettings && settings && (
            <div className="xl:hidden col-span-full">
              <SettingsPanel
                settings={settings}
                onSave={async (s) => {
                  await saveSettings(s);
                  toast({ title: "Settings saved" });
                }}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
