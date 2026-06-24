import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessions } from "@/hooks/useSessions";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Session } from "@/lib/types/session";
import {
  Monitor, Smartphone, Tablet, Globe, MapPin, Clock, X,
  ShieldAlert, ChevronDown, ChevronUp, RefreshCw, Zap,
  Wifi, WifiOff, AlertTriangle, CheckCircle, Ban, Eye,
  ArrowUpRight, Loader2, Shield,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgoLive(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function getDeviceIcon(device: string) {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("phone")) return Smartphone;
  if (d.includes("ipad") || d.includes("tablet")) return Tablet;
  return Monitor;
}

function getDeviceCategory(device: string): "mobile" | "tablet" | "desktop" {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("mobile") || d.includes("phone")) return "mobile";
  if (d.includes("ipad") || d.includes("tablet")) return "tablet";
  return "desktop";
}

function getRiskLevel(session: Session & { risk?: string }): "safe" | "warning" | "danger" {
  if (session.risk === "danger") return "danger";
  if (session.risk === "warning") return "warning";
  return "safe";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  startedAt: string;
  terminatedAt: string;
  reason: "logout" | "revoked" | "expired" | "suspicious";
  duration: string;
}

// ─── Mock session history ─────────────────────────────────────────────────────

const SESSION_HISTORY: HistoryEntry[] = [
  {
    id: "h1", device: "MacBook Pro 14\"", browser: "Chrome 123", os: "macOS 14",
    ip: "192.168.1.1", location: "San Francisco, CA",
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    terminatedAt: new Date(Date.now() - 86400000).toISOString(),
    reason: "logout", duration: "4h 12m",
  },
  {
    id: "h2", device: "iPhone 15 Pro", browser: "Safari 17", os: "iOS 17",
    ip: "10.0.0.12", location: "San Francisco, CA",
    startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    terminatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reason: "expired", duration: "23h 59m",
  },
  {
    id: "h3", device: "Unknown Device", browser: "Chrome 122", os: "Windows 11",
    ip: "185.220.101.47", location: "Moscow, Russia",
    startedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    terminatedAt: new Date(Date.now() - 86400000 * 5 + 300000).toISOString(),
    reason: "suspicious", duration: "5m",
  },
  {
    id: "h4", device: "Windows PC", browser: "Firefox 124", os: "Windows 10",
    ip: "172.16.0.5", location: "Austin, TX",
    startedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    terminatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    reason: "revoked", duration: "8h 45m",
  },
  {
    id: "h5", device: "MacBook Air", browser: "Safari 17", os: "macOS 13",
    ip: "192.168.5.21", location: "New York, NY",
    startedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    terminatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    reason: "logout", duration: "2h 3m",
  },
];

const REASON_META: Record<HistoryEntry["reason"], { label: string; color: string; icon: typeof CheckCircle }> = {
  logout: { label: "Logged Out", color: "text-white/50", icon: CheckCircle },
  expired: { label: "Expired", color: "text-white/40", icon: Clock },
  revoked: { label: "Revoked", color: "text-amber-400", icon: Ban },
  suspicious: { label: "Terminated — Suspicious", color: "text-red-400", icon: AlertTriangle },
};

const RISK_META = {
  safe: { label: "Safe", dot: "bg-emerald-400", text: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
  warning: { label: "Unusual", dot: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-500/10 border-amber-500/20 text-amber-300" },
  danger: { label: "Suspicious", dot: "bg-red-400", text: "text-red-400", badge: "bg-red-500/10 border-red-500/20 text-red-300" },
};

type FilterTab = "active" | "history";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveTicker({ lastActive }: { lastActive: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);
  return <span>{timeAgoLive(lastActive)}</span>;
}

interface SessionCardProps {
  session: Session;
  onRevoke?: (id: string) => Promise<void>;
  isRevoking?: boolean;
}

function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const DeviceIcon = getDeviceIcon(session.device);
  const category = getDeviceCategory(session.device);
  const risk = getRiskLevel(session as Session & { risk?: string });
  const riskMeta = RISK_META[risk];

  const deviceColor = session.isCurrent
    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
    : category === "mobile"
    ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
    : "bg-white/5 border-white/10 text-white/40";

  return (
    <motion.div layout>
      <GlassCard
        className={`overflow-hidden transition-all duration-300 ${
          session.isCurrent ? "border-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.08)]" :
          risk === "danger" ? "border-red-500/20" :
          risk === "warning" ? "border-amber-500/15" : ""
        }`}
        glow={session.isCurrent ? "cyan" : risk !== "safe" ? "none" : "none"}
      >
        {/* Main row */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Device icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${deviceColor}`}>
              <DeviceIcon className="w-5 h-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-semibold text-sm">{session.device}</p>
                {session.isCurrent && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium shrink-0">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
                    </span>
                    Current
                  </span>
                )}
                {risk !== "safe" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskMeta.badge}`}>
                    {riskMeta.label}
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs mt-0.5">{session.browser} · {session.os}</p>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-white/35 text-xs">
                  <Globe className="w-3 h-3" />{session.ip}
                </span>
                <span className="flex items-center gap-1 text-white/35 text-xs">
                  <MapPin className="w-3 h-3" />{session.location}
                </span>
                <span className="flex items-center gap-1 text-white/35 text-xs">
                  <Wifi className="w-3 h-3 text-emerald-400/60" />
                  <span className="text-white/40">Active </span>
                  <LiveTicker lastActive={session.lastActive} />
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                title={expanded ? "Collapse" : "View details"}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {!session.isCurrent && onRevoke && (
                confirmRevoke ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { onRevoke(session.id); setConfirmRevoke(false); }}
                      disabled={isRevoking}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium transition-all disabled:opacity-50"
                    >
                      {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmRevoke(false)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRevoke(true)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/8 hover:bg-red-500/15 text-red-400/80 hover:text-red-300 border border-red-500/15 hover:border-red-500/30 transition-all font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> End
                  </button>
                )
              )}
            </div>
          </div>

          {/* Expandable detail panel */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Session ID", value: session.id.slice(0, 20) + "…" },
                    { label: "IP Address", value: session.ip },
                    { label: "Location", value: session.location },
                    { label: "Device Type", value: category.charAt(0).toUpperCase() + category.slice(1) },
                    { label: "Started", value: formatDateTime(session.createdAt) },
                    { label: "Last Active", value: formatDateTime(session.lastActive) },
                    { label: "Operating System", value: session.os },
                    { label: "Browser", value: session.browser },
                    { label: "Risk Level", value: riskMeta.label },
                  ].map(d => (
                    <div key={d.label} className="space-y-0.5">
                      <p className="text-white/30 text-xs uppercase tracking-wider">{d.label}</p>
                      <p className={`text-xs font-medium truncate ${
                        d.label === "Risk Level" ? riskMeta.text : "text-white/70"
                      }`}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {risk !== "safe" && (
                  <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg border ${
                    risk === "danger" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20"
                  }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${risk === "danger" ? "text-red-400" : "text-amber-400"}`} />
                    <p className={`text-xs ${risk === "danger" ? "text-red-300/80" : "text-amber-300/80"}`}>
                      {risk === "danger"
                        ? "This session is flagged as suspicious — login from an unusual location. Terminate immediately if unrecognized."
                        : "This session has some unusual characteristics. Review if you don't recognize this device."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom progress bar for current session */}
        {session.isCurrent && (
          <div className="h-0.5 bg-gradient-to-r from-cyan-500/60 via-violet-500/40 to-transparent" />
        )}
      </GlassCard>
    </motion.div>
  );
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const DeviceIcon = getDeviceIcon(entry.device);
  const meta = REASON_META[entry.reason];
  const Icon = meta.icon;

  return (
    <motion.div layout>
      <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        entry.reason === "suspicious"
          ? "bg-red-500/5 border-red-500/15"
          : entry.reason === "revoked"
          ? "bg-amber-500/5 border-amber-500/15"
          : "bg-white/3 border-white/8"
      } hover:border-white/15`}>
        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
          <DeviceIcon className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white/60 text-sm font-medium">{entry.device}</p>
            <span className={`flex items-center gap-1 text-xs font-medium ${meta.color}`}>
              <Icon className="w-3 h-3" />{meta.label}
            </span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">{entry.browser} · {entry.os} · {entry.location}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-white/25 text-xs">{formatDateTime(entry.startedAt)}</span>
            <span className="text-white/15 text-xs">→</span>
            <span className="text-white/25 text-xs">{formatDateTime(entry.terminatedAt)}</span>
            <span className="text-white/20 text-xs">({entry.duration})</span>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/8">
                  {[
                    { label: "IP", value: entry.ip },
                    { label: "Duration", value: entry.duration },
                    { label: "Started", value: formatDateTime(entry.startedAt) },
                    { label: "Ended", value: formatDateTime(entry.terminatedAt) },
                  ].map(d => (
                    <div key={d.label}>
                      <p className="text-white/25 text-xs uppercase tracking-wider">{d.label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{d.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { user } = useAuth();
  const { sessions, isLoading, revokeSession, revokeAll, refresh } = useSessions();
  const { toast } = useToast();
  const [tab, setTab] = useState<FilterTab>("active");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);
  const riskySectionRef = useRef<HTMLDivElement>(null);

  // Live ticker for relative timestamps
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const current = sessions.find(s => s.isCurrent);
  const others = sessions.filter(s => !s.isCurrent);

  // Augment sessions with mock risk data
  const augmented = sessions.map(s => {
    if (s.location?.toLowerCase().includes("russia") || s.ip?.startsWith("185.")) {
      return { ...s, risk: "danger" };
    }
    if (s.location?.toLowerCase().includes("london") || s.location?.toLowerCase().includes("unknown")) {
      return { ...s, risk: "warning" };
    }
    return { ...s, risk: "safe" };
  });

  const riskyCount = augmented.filter(s => s.risk !== "safe").length;

  const uniqueCountries = new Set(sessions.map(s => s.location?.split(",").pop()?.trim())).size;

  const oldestSession = sessions.reduce((oldest, s) => {
    return !oldest || new Date(s.createdAt) < new Date(oldest.createdAt) ? s : oldest;
  }, null as Session | null);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      toast({ title: "Session terminated", description: "The session has been successfully ended." });
    } catch {
      toast({ title: "Error", description: "Failed to revoke session.", variant: "destructive" });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await revokeAll();
      setConfirmRevokeAll(false);
      toast({ title: "All sessions terminated", description: `${others.length} session${others.length !== 1 ? "s" : ""} have been ended.` });
    } catch {
      toast({ title: "Error", description: "Failed to revoke sessions.", variant: "destructive" });
    } finally {
      setRevokingAll(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <AppShell title="Session Manager" subtitle="Monitor and control all your active sessions">
      <div className="p-4 sm:p-6 max-w-5xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── STATS BAR ─────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Active Sessions",
                  value: sessions.length,
                  icon: Wifi,
                  color: "text-cyan-400",
                  bg: "bg-cyan-500/10 border-cyan-500/20",
                },
                {
                  label: "Countries",
                  value: uniqueCountries,
                  icon: Globe,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20",
                },
                {
                  label: "Threats Flagged",
                  value: riskyCount,
                  icon: riskyCount > 0 ? AlertTriangle : Shield,
                  color: riskyCount > 0 ? "text-amber-400" : "text-emerald-400",
                  bg: riskyCount > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  label: "Session History",
                  value: SESSION_HISTORY.length,
                  icon: Clock,
                  color: "text-white/50",
                  bg: "bg-white/5 border-white/10",
                },
              ].map(stat => (
                <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 shrink-0 ${stat.color}`} />
                  <div>
                    <p className="text-white font-bold text-xl leading-none tabular-nums">{stat.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── TABS + ACTIONS ─────────────────────────────────────────── */}
          <motion.div variants={item} className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {(["active", "history"] as FilterTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    tab === t
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t === "active" ? `Active (${sessions.length})` : `History (${SESSION_HISTORY.length})`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {others.length > 0 && tab === "active" && (
                confirmRevokeAll ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/50 text-xs">End {others.length} sessions?</span>
                    <button
                      onClick={handleRevokeAll}
                      disabled={revokingAll}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-all"
                    >
                      {revokingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                      {revokingAll ? "Ending…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmRevokeAll(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 text-xs transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRevokeAll(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 hover:border-red-500/35 text-xs font-medium transition-all"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> End All Others
                  </button>
                )
              )}
            </div>
          </motion.div>

          {/* ── ACTIVE SESSIONS ───────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {tab === "active" && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-28 rounded-xl border border-white/8 bg-white/3 animate-pulse" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-20">
                    <WifiOff className="w-12 h-12 mx-auto mb-4 text-white/15" />
                    <p className="text-white/40 text-sm">No active sessions found</p>
                    <p className="text-white/20 text-xs mt-1">Sessions will appear here after signing in</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current session hero */}
                    {current && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Current Session</span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                        <SessionCard
                          session={augmented.find(s => s.id === current.id) ?? current}
                        />
                      </div>
                    )}

                    {/* Other sessions */}
                    {others.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white/30 text-xs uppercase tracking-widest font-medium">
                            Other Sessions ({others.length})
                          </span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                        <div className="space-y-3">
                          {others.map((s, idx) => {
                            const aug = augmented.find(a => a.id === s.id) ?? s;
                            const isFirstRisky = idx === others.findIndex(o => {
                              const a = augmented.find(a => a.id === o.id);
                              return a && (a as typeof aug & { risk?: string }).risk !== "safe";
                            });
                            return (
                              <div key={s.id} ref={isFirstRisky ? riskySectionRef : undefined}>
                                <SessionCard
                                  session={aug}
                                  onRevoke={handleRevoke}
                                  isRevoking={revokingId === s.id}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Risky session alert */}
                    {riskyCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/25 bg-amber-500/8"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-amber-300 text-sm font-semibold">
                            {riskyCount} suspicious session{riskyCount > 1 ? "s" : ""} detected
                          </p>
                          <p className="text-white/45 text-xs mt-0.5">
                            Review flagged sessions and terminate any you don't recognize. If suspicious, change your password immediately.
                          </p>
                        </div>
                        <button
                          onClick={() => riskySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                          className="shrink-0 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/25 hover:border-amber-500/40 px-2.5 py-1.5 rounded-lg bg-amber-500/10 transition-all"
                        >
                          Review <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SESSION HISTORY ─────────────────────────────────────── */}
            {tab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-5" glow="none">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-white/40" />
                    <h3 className="text-white font-semibold text-sm">Terminated Sessions</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40 border border-white/10">
                      Last 30 days
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    {Object.entries(REASON_META).map(([key, meta]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <meta.icon className={`w-3 h-3 ${meta.color}`} />
                        <span className={`text-xs ${meta.color}`}>{meta.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {SESSION_HISTORY.map(entry => (
                      <HistoryCard key={entry.id} entry={entry} />
                    ))}
                  </div>

                  {/* Summary stats */}
                  <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Total Sessions", value: SESSION_HISTORY.length + sessions.length, color: "text-white" },
                      { label: "Normal Logouts", value: SESSION_HISTORY.filter(h => h.reason === "logout").length, color: "text-white/60" },
                      { label: "Manually Revoked", value: SESSION_HISTORY.filter(h => h.reason === "revoked").length, color: "text-amber-400" },
                      { label: "Suspicious", value: SESSION_HISTORY.filter(h => h.reason === "suspicious").length, color: "text-red-400" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg bg-white/4 border border-white/8">
                        <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AppShell>
  );
}
