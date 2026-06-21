import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDevices } from "@/hooks/useDevices";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { Device, DeviceType } from "@/lib/types/device";
import {
  Monitor, Smartphone, Tablet, Shield, ShieldOff, Trash2, Plus,
  CheckCircle, MapPin, Globe, Clock, ChevronDown, ChevronUp,
  Loader2, RefreshCw, Glasses, Scan, Cpu, Wifi, WifiOff,
  Zap, X,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 30) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getOnlineStatus(lastSeen: string): "online" | "recent" | "away" | "offline" {
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 300000) return "online";       // < 5min
  if (diff < 3600000) return "recent";      // < 1h
  if (diff < 86400000) return "away";       // < 24h
  return "offline";
}

const ONLINE_META = {
  online: { label: "Online", dot: "bg-emerald-400", text: "text-emerald-400", ping: true },
  recent: { label: "Recently active", dot: "bg-emerald-400/60", text: "text-emerald-400/70", ping: false },
  away: { label: "Away", dot: "bg-amber-400", text: "text-amber-400", ping: false },
  offline: { label: "Offline", dot: "bg-white/20", text: "text-white/30", ping: false },
};

// ─── Device type config ───────────────────────────────────────────────────────

const DEVICE_META: Record<DeviceType, {
  label: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  glow: string;
  badge?: string;
  xr?: boolean;
}> = {
  desktop: {
    label: "Desktop",
    Icon: Monitor,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.15)]",
  },
  mobile: {
    label: "Mobile",
    Icon: Smartphone,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
  },
  tablet: {
    label: "Tablet",
    Icon: Tablet,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  vr: {
    label: "VR Headset",
    Icon: Glasses,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/30",
    glow: "shadow-[0_0_20px_rgba(217,70,239,0.2)]",
    badge: "XR",
    xr: true,
  },
  ar: {
    label: "AR Glasses",
    Icon: Scan,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    badge: "XR",
    xr: true,
  },
};

type FilterType = "all" | DeviceType;

// ─── Mock device history ──────────────────────────────────────────────────────

interface RemovedDevice {
  id: string;
  name: string;
  type: DeviceType;
  os: string;
  browser: string;
  removedAt: string;
  reason: "manual" | "suspicious" | "expired";
  location?: string;
}

const DEVICE_HISTORY: RemovedDevice[] = [
  { id: "rh1", name: "Dell XPS 15", type: "desktop", os: "Windows 11", browser: "Edge 122", removedAt: new Date(Date.now() - 86400000 * 5).toISOString(), reason: "manual", location: "Austin, TX" },
  { id: "rh2", name: "Unknown Android", type: "mobile", os: "Android 13", browser: "Chrome 121", removedAt: new Date(Date.now() - 86400000 * 9).toISOString(), reason: "suspicious", location: "Moscow, Russia" },
  { id: "rh3", name: "Samsung Galaxy Tab", type: "tablet", os: "Android 14", browser: "Samsung Internet", removedAt: new Date(Date.now() - 86400000 * 15).toISOString(), reason: "expired", location: "New York, NY" },
  { id: "rh4", name: "HTC Vive Pro 2", type: "vr", os: "SteamVR 1.9", browser: "Steam Browser", removedAt: new Date(Date.now() - 86400000 * 21).toISOString(), reason: "manual", location: "San Francisco, CA" },
];

const REMOVE_REASON_META = {
  manual: { label: "Removed manually", color: "text-white/40" },
  suspicious: { label: "Removed — suspicious", color: "text-red-400" },
  expired: { label: "Expired / inactive", color: "text-white/30" },
};

// ─── Animations ───────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

// ─── Device Card ──────────────────────────────────────────────────────────────

interface DeviceCardProps {
  device: Device;
  onToggleTrust: (id: string, trusted: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  trustingId: string | null;
  removingId: string | null;
}

function DeviceCard({ device, onToggleTrust, onRemove, trustingId, removingId }: DeviceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const meta = DEVICE_META[device.type] ?? DEVICE_META.desktop;
  const { Icon } = meta;
  const status = getOnlineStatus(device.lastSeen);
  const online = ONLINE_META[status];
  const isTrusting = trustingId === device.id;
  const isRemoving = removingId === device.id;

  return (
    <motion.div layout className="flex flex-col">
      <GlassCard
        className={`overflow-hidden flex flex-col h-full transition-all duration-300 ${
          device.isCurrentDevice
            ? "border-emerald-500/25 " + (device.trusted ? "" : "")
            : device.trusted
            ? "border-emerald-500/15"
            : meta.xr
            ? "border-fuchsia-500/15"
            : ""
        }`}
        glow={device.isCurrentDevice ? "emerald" : "none"}
      >
        <div className="p-5 flex flex-col flex-1">

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Device icon */}
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border} ${meta.glow}`}>
                <Icon className={`w-6 h-6 ${meta.color}`} />
                {meta.xr && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 border border-[#050c1a] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">XR</span>
                  </div>
                )}
              </div>

              {/* Name + type */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-white font-semibold text-sm truncate">{device.name}</p>
                  {device.isCurrentDevice && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 font-medium shrink-0 whitespace-nowrap">
                      This Device
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  {meta.xr && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300 border border-fuchsia-500/20">
                      Extended Reality
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Online status + expand */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                <span className={`relative flex w-2 h-2`}>
                  {online.ping && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${online.dot}`} />
                </span>
              </div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-2 flex-1">
            {[
              { label: "OS", value: device.os },
              { label: "Browser", value: device.browser },
              { label: "Last seen", value: timeAgoShort(device.lastSeen) },
              { label: "Location", value: device.location ?? "Unknown" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-white/35 text-xs">{row.label}</span>
                <span className="text-white/65 text-xs font-medium truncate max-w-[60%] text-right">{row.value}</span>
              </div>
            ))}

            {/* Trust badge */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-white/35 text-xs">Trust status</span>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                device.trusted
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-white/5 text-white/30 border-white/10"
              }`}>
                {device.trusted ? <><CheckCircle className="w-3 h-3" />Trusted</> : <><X className="w-3 h-3" />Untrusted</>}
              </span>
            </div>
          </div>

          {/* Expandable details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
                  {[
                    { label: "Device ID", value: device.id },
                    { label: "IP Address", value: device.ip ?? "Unknown" },
                    { label: "Registered", value: formatDate(device.registeredAt) },
                    { label: "User Agent", value: `${device.browser} on ${device.os}` },
                    ...(meta.xr ? [{ label: "XR Platform", value: device.type === "vr" ? "Virtual Reality" : "Augmented Reality" }] : []),
                  ].map(d => (
                    <div key={d.label} className="flex items-start gap-2">
                      <span className="text-white/25 text-xs w-24 shrink-0">{d.label}</span>
                      <span className="text-white/50 text-xs font-mono break-all">{d.value}</span>
                    </div>
                  ))}

                  {meta.xr && (
                    <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-fuchsia-500/8 to-violet-500/8 border border-fuchsia-500/15">
                      <p className="text-fuchsia-300/80 text-xs font-medium flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> XR-Ready
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        This device supports spatial computing interactions. Full XR integration coming soon.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
            <button
              onClick={() => onToggleTrust(device.id, !device.trusted)}
              disabled={isTrusting}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all disabled:opacity-50 ${
                device.trusted
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 hover:border-amber-500/35"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20 hover:border-emerald-500/35"
              }`}
            >
              {isTrusting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : device.trusted ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />
              }
              {device.trusted ? "Untrust" : "Trust"}
            </button>

            {confirmRemove ? (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onRemove(device.id); setConfirmRemove(false); }}
                  disabled={isRemoving}
                  className="flex items-center gap-1 text-xs py-2 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold transition-all"
                >
                  {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs py-2 px-2 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-lg bg-red-500/8 hover:bg-red-500/15 text-red-400/70 hover:text-red-300 border border-red-500/15 hover:border-red-500/25 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom accent bar */}
        {(device.isCurrentDevice || meta.xr) && (
          <div className={`h-0.5 ${
            device.isCurrentDevice
              ? "bg-gradient-to-r from-emerald-500/60 via-cyan-500/40 to-transparent"
              : "bg-gradient-to-r from-fuchsia-500/60 via-violet-500/40 to-transparent"
          }`} />
        )}
      </GlassCard>
    </motion.div>
  );
}

// ─── History entry ────────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: RemovedDevice }) {
  const meta = DEVICE_META[entry.type] ?? DEVICE_META.desktop;
  const { Icon } = meta;
  const reasonMeta = REMOVE_REASON_META[entry.reason];

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-white/15 ${
      entry.reason === "suspicious"
        ? "bg-red-500/5 border-red-500/15"
        : "bg-white/3 border-white/8"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border} opacity-50`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/55 text-sm font-medium">{entry.name}</span>
          <span className={`text-xs ${reasonMeta.color}`}>{reasonMeta.label}</span>
        </div>
        <p className="text-white/25 text-xs mt-0.5">{entry.os} · {entry.browser} · {entry.location}</p>
      </div>
      <span className="text-white/25 text-xs whitespace-nowrap shrink-0">{timeAgoShort(entry.removedAt)}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const { devices, isLoading, toggleTrust, removeDevice, registerDevice, refresh } = useDevices();
  const { toast } = useToast();

  const [filter, setFilter] = useState<FilterType>("all");
  const [trustingId, setTrustingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleTrust = async (id: string, trusted: boolean) => {
    setTrustingId(id);
    try {
      await toggleTrust(id, trusted);
      toast({
        title: trusted ? "Device trusted" : "Device untrusted",
        description: trusted ? "This device now has elevated access." : "Trust removed from this device.",
      });
    } catch {
      toast({ title: "Error", description: "Failed to update trust status.", variant: "destructive" });
    } finally {
      setTrustingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeDevice(id);
      toast({ title: "Device removed", description: "The device has been removed from your account." });
    } catch {
      toast({ title: "Error", description: "Failed to remove device.", variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const device = await registerDevice();
      if (device) {
        toast({ title: "Device registered", description: `${device.name} has been added to your account.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to register device.", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Counts
  const typeCounts = devices.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trustedCount = devices.filter(d => d.trusted).length;
  const xrCount = devices.filter(d => d.type === "vr" || d.type === "ar").length;

  const filtered = filter === "all" ? devices : devices.filter(d => d.type === filter);
  const currentDevice = devices.find(d => d.isCurrentDevice);

  const ALL_FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${devices.length})` },
    { key: "desktop", label: `Desktop${typeCounts.desktop ? ` (${typeCounts.desktop})` : ""}` },
    { key: "mobile", label: `Mobile${typeCounts.mobile ? ` (${typeCounts.mobile})` : ""}` },
    { key: "tablet", label: `Tablet${typeCounts.tablet ? ` (${typeCounts.tablet})` : ""}` },
    { key: "vr", label: `VR${typeCounts.vr ? ` (${typeCounts.vr})` : ""}` },
    { key: "ar", label: `AR${typeCounts.ar ? ` (${typeCounts.ar})` : ""}` },
  ];
  const FILTER_TABS = ALL_FILTER_TABS.filter(t => t.key === "all" || (typeCounts[t.key as string] ?? 0) > 0);

  return (
    <AppShell title="Device Manager" subtitle="Manage trusted devices and XR hardware connected to your account">
      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── STATS BAR ─────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Devices", value: devices.length, icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                { label: "Trusted", value: trustedCount, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "XR Devices", value: xrCount, icon: Glasses, color: "text-fuchsia-400", bg: xrCount > 0 ? "bg-fuchsia-500/10 border-fuchsia-500/20" : "bg-white/5 border-white/10" },
                { label: "Removed (30d)", value: DEVICE_HISTORY.length, icon: Trash2, color: "text-white/40", bg: "bg-white/5 border-white/10" },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg}`}>
                  <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                  <div>
                    <p className="text-white font-bold text-xl leading-none tabular-nums">{s.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── TOOLBAR ───────────────────────────────────────────────── */}
          <motion.div variants={item} className="flex items-center justify-between gap-3 flex-wrap">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 overflow-x-auto">
              {FILTER_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    filter === t.key
                      ? t.key === "vr" || t.key === "ar"
                        ? "bg-fuchsia-600/30 text-fuchsia-200 border border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                        : "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-xs font-medium transition-all disabled:opacity-50"
              >
                {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Register Device
              </button>
            </div>
          </motion.div>

          {/* ── CURRENT DEVICE HERO ──────────────────────────────────── */}
          {currentDevice && filter === "all" && (
            <motion.div variants={item}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Current Device</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              <GlassCard className="p-5 border-emerald-500/25 shadow-[0_0_25px_rgba(16,185,129,0.06)]" glow="emerald">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0">
                    {(() => {
                      const m = DEVICE_META[currentDevice.type];
                      return <m.Icon className="w-7 h-7 text-emerald-400" />;
                    })()}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#050c1a] flex items-center justify-center">
                      <span className="relative flex w-2 h-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-base">{currentDevice.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 font-medium">This Device</span>
                      {currentDevice.trusted && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-medium">
                          <CheckCircle className="w-3 h-3" /> Trusted
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm mt-0.5">{currentDevice.browser} on {currentDevice.os}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-white/35 text-xs"><Globe className="w-3 h-3" />{currentDevice.ip ?? "—"}</span>
                      <span className="flex items-center gap-1 text-white/35 text-xs"><MapPin className="w-3 h-3" />{currentDevice.location ?? "Unknown"}</span>
                      <span className="flex items-center gap-1 text-emerald-400/70 text-xs"><Wifi className="w-3 h-3" />Active now</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-white/25 text-xs">Registered {formatDate(currentDevice.registeredAt)}</span>
                    <button
                      onClick={() => handleToggleTrust(currentDevice.id, !currentDevice.trusted)}
                      disabled={trustingId === currentDevice.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                        currentDevice.trusted
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                    >
                      {trustingId === currentDevice.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : currentDevice.trusted ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />
                      }
                      {currentDevice.trusted ? "Untrust" : "Trust"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-0.5 bg-gradient-to-r from-emerald-500/50 via-cyan-500/30 to-transparent rounded-full" />
              </GlassCard>
            </motion.div>
          )}

          {/* ── DEVICE GRID ───────────────────────────────────────────── */}
          <motion.div variants={item}>
            {filtered.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white/30 text-xs uppercase tracking-widest font-medium">
                  {filter === "all" ? "All Devices" : `${DEVICE_META[filter]?.label ?? filter} Devices`}
                </span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-xl border border-white/8 bg-white/3 animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <WifiOff className="w-10 h-10 mx-auto mb-3 text-white/15" />
                    <p className="text-white/35 text-sm">No {filter !== "all" ? filter : ""} devices found</p>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filtered
                      .filter(d => filter !== "all" || !d.isCurrentDevice) // current shown in hero
                      .map(device => (
                        <motion.div
                          key={device.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.25 }}
                        >
                          <DeviceCard
                            device={device}
                            onToggleTrust={handleToggleTrust}
                            onRemove={handleRemove}
                            trustingId={trustingId}
                            removingId={removingId}
                          />
                        </motion.div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>

          {/* ── XR INTEGRATION SECTION ────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard className="p-5 border-fuchsia-500/15" glow="none">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600/30 to-violet-600/30 border border-fuchsia-500/30 flex items-center justify-center">
                  <Glasses className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">XR Integration Hub</h3>
                  <p className="text-white/35 text-xs">Extended Reality device support — Virtual & Augmented Reality</p>
                </div>
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300 border border-fuchsia-500/20 font-medium">
                  Roadmap
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Glasses,
                    title: "VR Headset Support",
                    desc: "Sign in from Meta Quest, PlayStation VR2, and Valve Index. Full spatial UI in virtual space.",
                    color: "fuchsia",
                    eta: "Q2 2025",
                    devices: ["Meta Quest 3", "PS VR2", "Valve Index"],
                  },
                  {
                    icon: Scan,
                    title: "AR Glasses Auth",
                    desc: "Authenticate with Apple Vision Pro and Ray-Ban Meta. Overlay security UI on the real world.",
                    color: "rose",
                    eta: "Q3 2025",
                    devices: ["Apple Vision Pro", "Ray-Ban Meta", "HoloLens 2"],
                  },
                  {
                    icon: Zap,
                    title: "Spatial Passkeys",
                    desc: "Gaze-based authentication and hand-gesture confirmation for XR environments.",
                    color: "violet",
                    eta: "Q4 2025",
                    devices: ["Biometric gaze", "Hand tracking", "Voice auth"],
                  },
                ].map(card => (
                  <div key={card.title} className={`p-4 rounded-xl border border-${card.color}-500/15 bg-${card.color}-500/5`}>
                    <div className="flex items-center justify-between mb-3">
                      <card.icon className={`w-6 h-6 text-${card.color}-400/70`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${card.color}-500/10 text-${card.color}-400/60 border border-${card.color}-500/15`}>
                        {card.eta}
                      </span>
                    </div>
                    <p className={`text-${card.color}-300/80 text-sm font-semibold mb-1`}>{card.title}</p>
                    <p className="text-white/30 text-xs leading-relaxed mb-3">{card.desc}</p>
                    <div className="space-y-1">
                      {card.devices.map(d => (
                        <div key={d} className="flex items-center gap-1.5">
                          <div className={`w-1 h-1 rounded-full bg-${card.color}-400/40`} />
                          <span className="text-white/25 text-xs">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* ── DEVICE HISTORY ────────────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard className="p-5" glow="none">
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <h3 className="text-white font-semibold text-sm">Device History</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40 border border-white/10">
                    {DEVICE_HISTORY.length} removed
                  </span>
                </div>
                {showHistory ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2">
                      {DEVICE_HISTORY.map(entry => (
                        <HistoryEntry key={entry.id} entry={entry} />
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: "Manual Removals", value: DEVICE_HISTORY.filter(h => h.reason === "manual").length, color: "text-white/60" },
                        { label: "Suspicious", value: DEVICE_HISTORY.filter(h => h.reason === "suspicious").length, color: "text-red-400" },
                        { label: "Expired", value: DEVICE_HISTORY.filter(h => h.reason === "expired").length, color: "text-white/40" },
                      ].map(s => (
                        <div key={s.label} className="p-2.5 rounded-lg bg-white/4 border border-white/8">
                          <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                          <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}

