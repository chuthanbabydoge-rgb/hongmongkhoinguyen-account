import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useIdentity } from "@/hooks/useIdentity";
import { useToast } from "@/hooks/use-toast";
import { formatUniverseId, isValidUniverseId, xpProgress } from "@/lib/utils/universeId";
import { FUTURE_MODULES, REPUTATION_RANK_META } from "@/lib/mock/identityMock";
import { UniverseIdentity, FutureModule } from "@/lib/types/identity";
import {
  Copy, Share2, QrCode, Search, Eye, EyeOff, CheckCircle2,
  Loader2, Star, Shield, Zap, Globe, Lock, X, ExternalLink,
  BadgeCheck, Fingerprint, Sparkles, ChevronRight, Clock,
  Trophy, BarChart3, Layers, Users,
} from "lucide-react";

// ─── Animations ───────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ─── Time helpers ─────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 transition-all ${className}`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> {label} copied!
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" /> {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Identity Card (front) ────────────────────────────────────────────────────
function IdentityCardFront({ identity }: { identity: UniverseIdentity }) {
  const rankMeta = REPUTATION_RANK_META[identity.stats.reputationRank];
  const xp = xpProgress(identity.stats.experience, identity.stats.experienceToNext);

  return (
    <div className="relative w-full aspect-[1.65/1] rounded-3xl overflow-hidden select-none">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1529] to-[#060c18]" />
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.3) 0%, transparent 60%)" }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Holographic shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />

      {/* Glow orbs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-cyan-600/15 blur-3xl" />

      {/* Border */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
      <div className="absolute inset-[1px] rounded-3xl border border-white/5 pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex flex-col p-5 sm:p-6 gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Fingerprint className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase">Universe ID</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-white font-mono font-bold text-base sm:text-lg tracking-widest">
                {identity.universeId}
              </p>
              {identity.verifiedAt && (
                <BadgeCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
            </div>
          </div>
          <div className={`px-2 py-1 rounded-lg border text-xs font-bold ${rankMeta.bg} ${rankMeta.color}`}>
            {identity.stats.reputationRank}
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${identity.avatarColor} flex items-center justify-center text-white font-bold text-xl sm:text-2xl shrink-0 shadow-lg`}>
            {identity.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-lg sm:text-xl leading-tight truncate">{identity.displayName}</p>
            <p className="text-white/40 text-xs mt-0.5 truncate">@{identity.username}</p>
            <p className="text-white/25 text-xs mt-1 italic truncate">{identity.title}</p>
          </div>
        </div>

        {/* Badges */}
        {identity.badges.length > 0 && (
          <div className="flex items-center gap-1.5">
            {identity.badges.map((b, i) => (
              <span key={i} className="text-base">{b}</span>
            ))}
          </div>
        )}

        {/* Bottom row — level + XP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white/35 text-xs flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Level {identity.stats.level}
            </span>
            <span className="text-white/30 text-[10px] font-mono">
              {identity.stats.experience.toLocaleString()} / {identity.stats.experienceToNext.toLocaleString()} XP
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${identity.avatarColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${xp}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Identity Card (back / QR) ────────────────────────────────────────────────
function IdentityCardBack({ identity }: { identity: UniverseIdentity }) {
  const profileUrl = `https://universe.io/profile/${identity.universeId}`;

  return (
    <div className="relative w-full aspect-[1.65/1] rounded-3xl overflow-hidden select-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#0d1529] to-[#060c18]" />
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.5) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.4) 0%, transparent 60%)" }} />
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />

      <div className="relative h-full flex items-center gap-6 p-5 sm:p-6">
        {/* QR Code */}
        <div className="p-3 rounded-2xl bg-white shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          <QRCodeSVG
            value={profileUrl}
            size={100}
            bgColor="#ffffff"
            fgColor="#050c1a"
            level="M"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Scan to visit profile</p>
            <p className="text-white font-mono font-bold text-base tracking-widest mt-1">{identity.universeId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-white/50 text-xs truncate">{profileUrl}</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${identity.visibility === "public" ? "bg-emerald-400" : "bg-white/25"}`} />
              <span className="text-white/30 text-xs capitalize">{identity.visibility} profile</span>
            </div>
          </div>
          <div className="pt-1 flex items-center gap-2">
            {identity.verifiedAt && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BadgeCheck className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 text-[10px] font-semibold">Verified</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Shield className="w-3 h-3 text-violet-400" />
              <span className="text-violet-400 text-[10px] font-semibold">SafePass Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search result card ───────────────────────────────────────────────────────
function SearchResultCard({ identity }: { identity: UniverseIdentity }) {
  const rankMeta = REPUTATION_RANK_META[identity.stats.reputationRank];
  const isPrivate = identity.visibility === "private";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${identity.avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
              {identity.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm truncate">{identity.displayName}</p>
                {identity.verifiedAt && <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              <p className="text-white/40 text-xs">@{identity.username}</p>
            </div>
            <div className={`px-2 py-0.5 rounded-lg border text-xs font-semibold shrink-0 ${rankMeta.bg} ${rankMeta.color}`}>
              {identity.stats.reputationRank}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 font-mono text-xs">{identity.universeId}</p>
            <div className="flex items-center gap-1.5">
              {isPrivate
                ? <div className="flex items-center gap-1 text-white/25 text-xs"><Lock className="w-3 h-3" />Private</div>
                : <div className="flex items-center gap-1 text-emerald-400/70 text-xs"><Globe className="w-3 h-3" />Public</div>
              }
            </div>
          </div>

          {!isPrivate && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Level", value: identity.stats.level },
                { label: "Reputation", value: identity.stats.reputation },
                { label: "Assets", value: identity.stats.assetsOwned },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-white font-bold text-sm">{s.value}</p>
                  <p className="text-white/30 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {isPrivate && (
            <p className="text-white/25 text-xs italic text-center py-2">
              This profile is set to private.
            </p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Future module card ───────────────────────────────────────────────────────
function FutureModuleCard({ module: mod }: { module: FutureModule }) {
  const statusMeta = {
    coming_soon: { label: "Coming Soon", color: "text-white/30", bg: "bg-white/5 border-white/10" },
    beta: { label: "Beta", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    available: { label: "Available", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  }[mod.status];

  return (
    <div className={`relative group flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 ${mod.status === "coming_soon" ? "bg-white/2 border-white/8 opacity-60 hover:opacity-80" : `${mod.bgColor} ${mod.borderColor} hover:opacity-90`}`}>
      {/* Glow on hover */}
      {mod.status !== "coming_soon" && (
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${mod.gradientFrom} ${mod.gradientTo} opacity-5`} />
      )}

      <div className="flex items-start justify-between relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${mod.bgColor} ${mod.borderColor}`}>
          {mod.icon}
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${statusMeta.color} ${statusMeta.bg}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="relative">
        <p className={`font-semibold text-sm mb-1 ${mod.status === "coming_soon" ? "text-white/40" : mod.textColor}`}>
          {mod.name}
        </p>
        <p className="text-white/25 text-xs leading-relaxed">{mod.description}</p>
      </div>

      {mod.eta && (
        <div className="flex items-center gap-1 relative">
          <Clock className="w-3 h-3 text-white/20" />
          <span className="text-white/25 text-xs">{mod.eta}</span>
        </div>
      )}

      {mod.status !== "coming_soon" && (
        <button className={`flex items-center gap-1.5 text-xs font-medium ${mod.textColor} opacity-70 hover:opacity-100 transition-opacity relative`}>
          <ExternalLink className="w-3 h-3" />
          Open module
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type CardFace = "front" | "back";

export default function IdentityPage() {
  const { identity, saving, searchResult, searching, setVisibility, searchUser, clearSearch } = useIdentity();
  const { toast } = useToast();

  const [cardFace, setCardFace] = useState<CardFace>("front");
  const [showQr, setShowQr] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  if (!identity) {
    return (
      <AppShell title="Digital Identity" subtitle="Your Universe Identity Card">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const profileUrl = `https://universe.io/profile/${identity.universeId}`;
  const rankMeta = REPUTATION_RANK_META[identity.stats.reputationRank];

  const handleSearch = () => {
    const q = searchInput.trim().toUpperCase();
    if (!q) return;
    const formatted = formatUniverseId(q);
    if (!isValidUniverseId(formatted)) {
      toast({ title: "Invalid ID format", description: "Universe IDs must follow the format UNI-XXXXXXXX", variant: "destructive" });
      return;
    }
    searchUser(formatted);
  };

  const handleToggleVisibility = async () => {
    const next = identity.visibility === "public" ? "private" : "public";
    await setVisibility(next);
    toast({ title: `Profile set to ${next}`, description: next === "public" ? "Your profile is now visible to everyone." : "Your profile is now hidden from public search." });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast({ title: "Profile link copied!", description: profileUrl });
    });
  };

  return (
    <AppShell title="Digital Identity" subtitle="Your Universe passport — verifiable, portable, futuristic">
      <div className="p-4 sm:p-6 max-w-6xl space-y-6">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── HEADER STATS ─────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Level", value: identity.stats.level, Icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Reputation", value: `${identity.stats.reputation}/100`, Icon: Star, color: rankMeta.color, bg: `${rankMeta.bg}` },
                { label: "Assets Owned", value: identity.stats.assetsOwned.toLocaleString(), Icon: Layers, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                { label: "Achievements", value: identity.stats.achievementsUnlocked, Icon: Trophy, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg}`}>
                  <s.Icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                  <div>
                    <p className={`font-bold text-xl leading-none tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── MAIN GRID: Card + Actions ─────────────────────────────── */}
          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

            {/* Left: Identity Card */}
            <div className="space-y-4">
              {/* Card flip toggle */}
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-violet-400" />
                  Identity Card
                </h2>
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
                  {([
                    { key: "front", label: "Profile", Icon: Eye },
                    { key: "back", label: "QR Code", Icon: QrCode },
                  ] as const).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setCardFace(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        cardFace === key
                          ? "bg-violet-600/30 text-violet-200 border border-violet-500/40"
                          : "text-white/35 hover:text-white/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card */}
              <AnimatePresence mode="wait">
                {cardFace === "front" ? (
                  <motion.div key="front" initial={{ opacity: 0, rotateY: -90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: 90 }} transition={{ duration: 0.35 }}>
                    <IdentityCardFront identity={identity} />
                  </motion.div>
                ) : (
                  <motion.div key="back" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.35 }}>
                    <IdentityCardBack identity={identity} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action bar below card */}
              <div className="flex flex-wrap gap-2">
                <CopyButton
                  text={identity.universeId}
                  label="Copy ID"
                  className="flex-1 justify-center text-xs py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-all"
                />
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/25 text-violet-300 hover:text-violet-200 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Profile
                </button>
                <button
                  onClick={handleToggleVisibility}
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border transition-all disabled:opacity-60 ${
                    identity.visibility === "public"
                      ? "bg-emerald-500/10 hover:bg-emerald-500/18 border-emerald-500/20 text-emerald-300"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : identity.visibility === "public" ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {identity.visibility === "public" ? "Public" : "Private"}
                </button>
              </div>
            </div>

            {/* Right: Identity details */}
            <div className="space-y-4">

              {/* Universe ID block */}
              <GlassCard className="border-violet-500/15">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Fingerprint className="w-4 h-4 text-violet-400" />
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Universe ID</p>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/8 border border-violet-500/15">
                    <p className="text-white font-mono font-bold text-lg tracking-[0.2em] flex-1">{identity.universeId}</p>
                    {identity.verifiedAt && <BadgeCheck className="w-5 h-5 text-cyan-400 shrink-0" />}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Username", value: `@${identity.username}` },
                      { label: "Display Name", value: identity.displayName },
                      { label: "Title", value: identity.title },
                      { label: "Member Since", value: formatDate(identity.stats.joinedAt) },
                      { label: "Last Seen", value: timeAgo(identity.lastSeen) },
                      { label: "Verified", value: identity.verifiedAt ? "✓ Yes" : "Not yet" },
                    ].map(row => (
                      <div key={row.label} className="space-y-0.5">
                        <p className="text-white/25">{row.label}</p>
                        <p className="text-white/65 font-medium truncate">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Reputation + Stats */}
              <GlassCard>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      Profile Stats
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${rankMeta.bg} ${rankMeta.color}`}>
                      {identity.stats.reputationRank}
                    </span>
                  </div>

                  {/* Reputation bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/35">Reputation Score</span>
                      <span className={`font-bold tabular-nums ${rankMeta.color}`}>{identity.stats.reputation} / 100</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${identity.avatarColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${identity.stats.reputation}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Worlds Visited", value: identity.stats.worldsVisited, Icon: Globe },
                      { label: "Trades Done", value: identity.stats.tradesCompleted, Icon: BarChart3 },
                      { label: "Achievements", value: identity.stats.achievementsUnlocked, Icon: Trophy },
                      { label: "Community", value: "—", Icon: Users },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/8">
                        <s.Icon className="w-3.5 h-3.5 text-white/25 shrink-0" />
                        <div>
                          <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                          <p className="text-white/25 text-[10px] mt-0.5">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* ── SEARCH BY UNIVERSE ID ─────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-white font-semibold text-sm">Search by Universe ID</h3>
                </div>

                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${searchFocused ? "bg-white/8 border-cyan-500/30" : "bg-white/4 border-white/10"}`}>
                    <Search className="w-4 h-4 text-white/25 shrink-0" />
                    <input
                      ref={searchRef}
                      value={searchInput}
                      onChange={e => {
                        setSearchInput(e.target.value.toUpperCase());
                        if (searchResult) clearSearch();
                      }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                      placeholder="UNI-XXXXXXXX"
                      className="flex-1 bg-transparent text-white font-mono text-sm placeholder:text-white/20 outline-none"
                      maxLength={12}
                    />
                    {searchInput && (
                      <button onClick={() => { setSearchInput(""); clearSearch(); }} className="text-white/25 hover:text-white/60 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={!searchInput.trim() || searching}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/25 text-cyan-300 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>

                <AnimatePresence>
                  {searching && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-white/40 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching the universe…
                    </motion.div>
                  )}
                  {searchResult === "not_found" && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15">
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-red-400/80 text-sm">No user found with that Universe ID.</p>
                    </motion.div>
                  )}
                  {searchResult && searchResult !== "not_found" && (
                    <SearchResultCard identity={searchResult} />
                  )}
                </AnimatePresence>

                <p className="text-white/20 text-xs">Try: <span className="font-mono text-white/35">UNI-A7X2K9P4</span> · <span className="font-mono text-white/35">UNI-C3R8T5VX</span> · <span className="font-mono text-white/35">UNI-B5N7Q3WZ</span></p>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── FUTURE INTEGRATIONS ───────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Connected Modules
                    <span className="text-xs font-normal text-white/30">— Identity is your passport to every module</span>
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {FUTURE_MODULES.map(mod => (
                  <FutureModuleCard key={mod.id} module={mod} />
                ))}
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-violet-300/80 text-sm font-medium">Your Universe ID is your passport</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    One identity, authenticated across Wallet, Inventory, Social, AI Companion, XR Worlds, and every future module.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/15 shrink-0 ml-auto" />
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}
