import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Notification,
  NotificationCategory,
  CATEGORY_META,
  PRIORITY_META,
  TYPE_META,
} from "@/lib/types/notification";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Trash,
  Search, Filter, ChevronRight, Loader2, Clock,
  BarChart3, Inbox, TrendingUp, AlertCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animation helpers ─────────────────────────────────────────────────────────

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const pop: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
};
const slideIn: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, x: 8, scale: 0.97, transition: { duration: 0.18 } },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "vừa xong";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(mo / 12)} năm trước`;
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel({ notifications }: { notifications: Notification[] }) {
  const total = notifications.length;
  const unread = notifications.filter((n) => !n.isRead).length;
  const read = total - unread;
  const urgent = notifications.filter((n) => n.priority === "urgent").length;

  const catCounts = (Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => {
    const catNotifs = notifications.filter((n) => n.category === cat);
    const catUnread = catNotifs.filter((n) => !n.isRead).length;
    return { cat, total: catNotifs.length, unread: catUnread };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Tổng Thông Báo", val: total, icon: <Bell className="w-4 h-4 text-violet-400" />, color: "text-violet-300", bg: "bg-violet-500/10 border-violet-500/20" },
        { label: "Chưa Đọc", val: unread, icon: <AlertCircle className="w-4 h-4 text-amber-400" />, color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
        { label: "Đã Đọc", val: read, icon: <CheckCheck className="w-4 h-4 text-emerald-400" />, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
        { label: "Khẩn Cấp", val: urgent, icon: <TrendingUp className="w-4 h-4 text-red-400" />, color: "text-red-300", bg: "bg-red-500/10 border-red-500/20" },
      ].map((s) => (
        <GlassCard key={s.label} className={cn("border", s.bg)}>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/8 shrink-0">
              {s.icon}
            </div>
            <div>
              <p className={cn("font-bold text-2xl leading-none tabular-nums", s.color)}>{val(s.val)}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
            </div>
          </div>
        </GlassCard>
      ))}

      {/* Category breakdown */}
      <GlassCard className="col-span-2 sm:col-span-4">
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Phân Bổ Theo Danh Mục</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {catCounts.map(({ cat, total: ct, unread: cu }) => {
              const m = CATEGORY_META[cat];
              const pct = total > 0 ? (ct / total) * 100 : 0;
              return (
                <div key={cat} className={cn("rounded-xl p-3 border space-y-2", m.bg, m.border)}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[10px] font-bold leading-tight truncate", m.color)}>{m.label}</p>
                      {cu > 0 && (
                        <p className="text-[9px] text-white/35">{cu} chưa đọc</p>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                      className={cn("h-full rounded-full", m.color.replace("text-", "bg-"))} />
                  </div>
                  <p className={cn("text-[9px] font-bold", m.color)}>{ct} thông báo</p>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function val(n: number) {
  return n.toLocaleString("vi-VN");
}

// ── Category tabs ─────────────────────────────────────────────────────────────

function CategoryTabs({
  selected,
  onChange,
  notifications,
}: {
  selected: NotificationCategory | "all";
  onChange: (c: NotificationCategory | "all") => void;
  notifications: Notification[];
}) {
  const cats: (NotificationCategory | "all")[] = [
    "all", "system", "security", "marketplace", "rewards", "social", "world_events",
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-wrap">
      {cats.map((cat) => {
        const isAll = cat === "all";
        const meta = isAll ? null : CATEGORY_META[cat as NotificationCategory];
        const catNotifs = isAll ? notifications : notifications.filter((n) => n.category === cat);
        const unread = catNotifs.filter((n) => !n.isRead).length;
        const active = selected === cat;

        return (
          <button key={cat} onClick={() => onChange(cat)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all shrink-0",
              active
                ? isAll
                  ? "bg-violet-600/25 border-violet-500/40 text-violet-200 shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                  : `${meta!.bg} ${meta!.border} ${meta!.color}`
                : "bg-white/4 border-white/10 text-white/35 hover:text-white/65 hover:bg-white/7"
            )}>
            <span className="text-base leading-none">{isAll ? "🔔" : meta!.icon}</span>
            <span>{isAll ? "Tất Cả" : meta!.label}</span>
            {unread > 0 && (
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-bold tabular-nums min-w-[18px] text-center",
                active ? "bg-red-500/30 text-red-200" : "bg-red-500/20 text-red-300"
              )}>
                {unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Notification card ─────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const catM = CATEGORY_META[notif.category];
  const prioM = PRIORITY_META[notif.priority];
  const typeM = TYPE_META[notif.type];
  const isUnread = !notif.isRead;

  return (
    <motion.div
      layout
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit="exit"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all group",
        isUnread
          ? `bg-gradient-to-r ${catM.gradient} ${catM.border}`
          : "bg-white/2 border-white/8 hover:bg-white/3 hover:border-white/12"
      )}
    >
      {/* Unread left accent */}
      {isUnread && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl",
          notif.priority === "urgent" ? "bg-red-400" :
          notif.priority === "high" ? "bg-orange-400" :
          catM.color.replace("text-", "bg-")
        )} />
      )}

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-xl border shrink-0 relative",
            catM.bg, catM.border
          )}>
            {catM.icon}
            {/* Priority dot */}
            {isUnread && notif.priority !== "low" && (
              <div className={cn(
                "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#050c1a]",
                prioM.dot
              )} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border", catM.bg, catM.border, catM.color)}>
                    {catM.icon} {catM.label}
                  </span>
                  {notif.priority !== "low" && (
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", prioM.badge)}>
                      {prioM.label}
                    </span>
                  )}
                  <span className="text-[9px] text-white/25">{typeM.icon} {typeM.label}</span>
                </div>
                <p className={cn(
                  "text-sm font-bold leading-tight",
                  isUnread ? "text-white" : "text-white/60"
                )}>
                  {notif.title}
                </p>
              </div>

              {/* Timestamp + actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-white/25 text-[10px] whitespace-nowrap flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(notif.createdAt)}
                </span>
                <AnimatePresence>
                  {hovered && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1">
                      {isUnread && (
                        <button onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                          title="Đánh dấu đã đọc"
                          className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all">
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                        title="Xóa thông báo"
                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-500/12 border border-red-500/25 text-red-400 hover:bg-red-500/22 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Body */}
            <p
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                "text-xs leading-relaxed cursor-pointer transition-all",
                isUnread ? "text-white/55" : "text-white/30",
                !expanded && "line-clamp-2"
              )}
            >
              {notif.body}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
              <button onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">
                <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
                {expanded ? "Thu gọn" : "Xem thêm"}
              </button>

              <div className="flex items-center gap-2">
                {notif.actionLabel && (
                  <button className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                    catM.bg, catM.border, catM.color, "hover:brightness-125"
                  )}>
                    {notif.actionLabel} <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
                {!isUnread && notif.readAt && (
                  <span className="text-[9px] text-white/15 flex items-center gap-0.5">
                    <CheckCheck className="w-2.5 h-2.5" /> {timeAgo(notif.readAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ReadFilter = "all" | "unread" | "read";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    liveToast,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "high" | "medium" | "low">("all");
  const [showStats, setShowStats] = useState(true);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (category !== "all" && n.category !== category) return false;
      if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;
      if (readFilter === "unread" && n.isRead) return false;
      if (readFilter === "read" && !n.isRead) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notifications, category, priorityFilter, readFilter, search]);

  if (isLoading) {
    return (
      <AppShell title="Trung Tâm Thông Báo" subtitle="Quản lý tất cả thông báo của bạn">
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-white/30 text-sm">Đang tải thông báo...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const readOptions: { key: ReadFilter; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Tất Cả", icon: <Filter className="w-3 h-3" /> },
    { key: "unread", label: "Chưa Đọc", icon: <Bell className="w-3 h-3" /> },
    { key: "read", label: "Đã Đọc", icon: <BellOff className="w-3 h-3" /> },
  ];

  return (
    <AppShell title="Trung Tâm Thông Báo" subtitle="Theo dõi mọi hoạt động và cập nhật trong Universe của bạn">
      {/* Live toast */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="fixed top-4 right-4 z-50 max-w-sm w-full"
          >
            <GlassCard className="border-violet-500/30 shadow-[0_0_30px_rgba(124,58,237,0.25)]">
              <div className="p-3 flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg border shrink-0",
                  CATEGORY_META[liveToast.category].bg, CATEGORY_META[liveToast.category].border)}>
                  {CATEGORY_META[liveToast.category].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs">{liveToast.title}</p>
                  <p className="text-white/45 text-[10px] line-clamp-2 mt-0.5">{liveToast.body}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse mt-1 shrink-0" />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

          {/* ── Hero header ──────────────────────────────────────── */}
          <motion.div variants={pop}>
            <GlassCard className="border-violet-500/20 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500" />
              <div className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.35)]">
                      <Bell className="w-7 h-7 text-white" />
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5 rounded-full bg-red-500 border-2 border-[#050c1a] flex items-center justify-center px-1">
                        <span className="text-white text-[10px] font-black tabular-nums">{unreadCount > 99 ? "99+" : unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">Trung Tâm Thông Báo</h1>
                    <p className="text-white/35 text-xs mt-0.5">
                      {unreadCount > 0
                        ? <span className="text-amber-300 font-semibold">{unreadCount} thông báo chưa đọc</span>
                        : <span className="text-emerald-300">Tất cả đã đọc ✓</span>}
                      <span className="text-white/20"> · {notifications.length} tổng thông báo</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setShowStats((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                      showStats ? "bg-violet-600/20 border-violet-500/35 text-violet-300" : "bg-white/5 border-white/10 text-white/40 hover:text-white/65"
                    )}>
                    <BarChart3 className="w-3.5 h-3.5" /> Thống Kê
                  </button>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border bg-emerald-500/12 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/22 transition-all">
                      <CheckCheck className="w-3.5 h-3.5" /> Đọc Tất Cả
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Stats ────────────────────────────────────────────── */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <motion.div variants={pop}>
                  <StatsPanel notifications={notifications} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Section header ────────────────────────────────────── */}
          <motion.div variants={pop} className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className="text-white font-bold text-lg">Danh Sách Thông Báo</h2>
            <div className="flex-1 h-px bg-white/8" />
          </motion.div>

          {/* ── Category tabs ─────────────────────────────────────── */}
          <motion.div variants={pop}>
            <CategoryTabs
              selected={category}
              onChange={setCategory}
              notifications={notifications}
            />
          </motion.div>

          {/* ── Search + Filters ──────────────────────────────────── */}
          <motion.div variants={pop}>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm thông báo..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 placeholder:text-white/20 text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/8 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Read filter */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
                {readOptions.map((o) => (
                  <button key={o.key} onClick={() => setReadFilter(o.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                      readFilter === o.key ? "bg-white/12 text-white border border-white/15" : "text-white/30 hover:text-white/55"
                    )}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>

              {/* Priority filter */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
                {(["all", "urgent", "high", "medium", "low"] as const).map((p) => {
                  const m = p !== "all" ? PRIORITY_META[p] : null;
                  return (
                    <button key={p} onClick={() => setPriorityFilter(p)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                        priorityFilter === p ? "bg-white/12 text-white border border-white/15" : "text-white/30 hover:text-white/55"
                      )}>
                      {p !== "all" && <div className={cn("w-2 h-2 rounded-full", m!.dot.replace(" animate-pulse", ""))} />}
                      {p === "all" ? "Mọi Ưu Tiên" : m!.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-white/20 text-xs whitespace-nowrap">{filtered.length} thông báo</span>
            </div>
          </motion.div>

          {/* ── Notification list ─────────────────────────────────── */}
          {filtered.length === 0 ? (
            <motion.div variants={pop} className="flex flex-col items-center justify-center py-24 text-center">
              <Inbox className="w-14 h-14 text-white/8 mb-4" />
              <p className="text-white/30 text-sm font-medium">Không có thông báo</p>
              <p className="text-white/15 text-xs mt-1">
                {search ? "Thử thay đổi từ khóa tìm kiếm" : "Không có thông báo nào khớp với bộ lọc"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((notif) => (
                  <NotifCard
                    key={notif.id}
                    notif={notif}
                    onMarkRead={markRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Bulk actions footer ───────────────────────────────── */}
          {filtered.length > 0 && (
            <motion.div variants={pop}>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/3 border border-white/8 flex-wrap gap-2">
                <span className="text-white/25 text-xs">Hiển thị {filtered.length} / {notifications.length} thông báo</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 transition-all">
                      <CheckCheck className="w-3 h-3" /> Đọc tất cả ({unreadCount})
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
