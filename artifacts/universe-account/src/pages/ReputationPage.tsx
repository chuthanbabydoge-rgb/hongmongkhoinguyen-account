import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  UserReputation,
  TradeRecord,
  ReviewEntry,
  VerificationLevel,
  VERIFICATION_META,
  TRADE_RESULT_META,
  TRADE_TYPE_META,
} from "@/lib/types/reputation";
import {
  apiGetUserReputation,
  apiGetUserTrades,
  apiGetUserReviews,
  apiRefreshReputation,
} from "@/lib/services/reputationService";
import {
  Shield,
  Star,
  TrendingUp,
  Users,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Send,
  ThumbsUp,
  MessageSquare,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animations ────────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function formatVolume(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-white/45 text-xs">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", color)}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          className={cn("h-full rounded-full", color === "text-violet-300" ? "bg-gradient-to-r from-violet-500 to-purple-400" :
            color === "text-cyan-300" ? "bg-gradient-to-r from-cyan-500 to-blue-400" :
            color === "text-emerald-300" ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
            color === "text-amber-300" ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
            "bg-gradient-to-r from-slate-400 to-slate-300")}
        />
      </div>
    </div>
  );
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "w-5 h-5" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(starSize, s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-white/15")}
        />
      ))}
    </div>
  );
}

// ── Verification Level Card ───────────────────────────────────────────────────

function VerificationLevelCard({ reputation }: { reputation: UserReputation }) {
  const current = VERIFICATION_META[reputation.verificationLevel];
  const levels: VerificationLevel[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  const currentIdx = levels.indexOf(reputation.verificationLevel);
  const next = currentIdx < levels.length - 1 ? VERIFICATION_META[levels[currentIdx + 1]] : null;
  const score = reputation.scores.overall;
  const levelPct = Math.min(
    100,
    Math.round(((score - current.minScore) / (current.maxScore - current.minScore)) * 100)
  );

  return (
    <GlassCard className={cn("overflow-hidden", current.border, current.glow)}>
      <div className={`h-1 bg-gradient-to-r ${current.gradient}`} />
      <div className="p-6">
        {/* Level badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shrink-0", current.bg, current.border)}>
              {current.icon}
            </div>
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">Verification Level</p>
              <p className={cn("text-2xl font-bold", current.color)}>{current.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <BadgeCheck className={cn("w-4 h-4", current.color)} />
                <span className="text-white/50 text-xs">Identity Verified</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={cn("text-3xl font-bold tabular-nums", current.color)}>{score}</p>
            <p className="text-white/30 text-xs mt-0.5">/ 1000 pts</p>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/35 text-xs">
              {next ? `Progress to ${next.label}` : "Maximum level reached"}
            </span>
            {next && (
              <span className={cn("text-xs font-semibold", current.color)}>{levelPct}%</span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: next ? `${levelPct}%` : "100%" }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
              className={cn("h-full rounded-full bg-gradient-to-r", current.gradient)}
            />
          </div>
          {next && (
            <div className="flex justify-between mt-1.5">
              <span className="text-white/20 text-[10px]">{current.minScore} pts</span>
              <span className="text-white/20 text-[10px]">{current.maxScore} pts</span>
            </div>
          )}
        </div>

        {/* Level ladder */}
        <div className="flex items-center gap-1 justify-between mt-5">
          {levels.map((lvl, i) => {
            const meta = VERIFICATION_META[lvl];
            const isActive = lvl === reputation.verificationLevel;
            const isPast = i < currentIdx;
            return (
              <div key={lvl} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all",
                  isActive ? `${meta.bg} ${meta.border} ${meta.glow}` :
                  isPast ? "bg-white/8 border-white/15" : "bg-white/3 border-white/8 opacity-40"
                )}>
                  {meta.icon}
                </div>
                <span className={cn("text-[9px] font-medium", isActive ? meta.color : isPast ? "text-white/35" : "text-white/15")}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Perks */}
      <div className="px-6 pb-5">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Current Perks</p>
        <div className="flex flex-wrap gap-1.5">
          {current.perks.map((perk) => (
            <span key={perk} className={cn("text-[10px] px-2 py-0.5 rounded-lg border font-medium", current.bg, current.border, current.text)}>
              {perk}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Score Panel ───────────────────────────────────────────────────────────────

function ScoresPanel({ scores }: { scores: UserReputation["scores"] }) {
  const scoreItems = [
    { label: "Trust Score", value: scores.trust, color: "text-violet-300", icon: <Shield className="w-4 h-4 text-violet-400" />, desc: "Based on transaction history, dispute outcomes, and community standing." },
    { label: "Community Rating", value: scores.community, color: "text-cyan-300", icon: <Users className="w-4 h-4 text-cyan-400" />, desc: "Reflects peer endorsements, forum activity, and moderation behavior." },
    { label: "Marketplace Rating", value: scores.marketplace, color: "text-emerald-300", icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, desc: "Derived from trade success rate, volume, and counterparty feedback." },
    { label: "SafePass Rating", value: scores.safePass, color: "text-amber-300", icon: <Lock className="w-4 h-4 text-amber-400" />, desc: "Security posture: 2FA status, device trust, anomaly-free sessions." },
  ];
  return (
    <GlassCard>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/40" />
          <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Score Breakdown</p>
        </div>
        <div className="space-y-4">
          {scoreItems.map((s) => (
            <div key={s.label}>
              <div className="flex items-center gap-2 mb-1.5">
                {s.icon}
                <span className="text-white/60 text-xs font-medium">{s.label}</span>
              </div>
              <ScoreBar label="" value={s.value} color={s.color} />
              <p className="text-white/25 text-[10px] mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Trade Stats ───────────────────────────────────────────────────────────────

function TradeStatsPanel({ reputation }: { reputation: UserReputation }) {
  const successRate = reputation.totalTrades > 0
    ? Math.round((reputation.successfulTrades / reputation.totalTrades) * 100)
    : 0;

  const stats = [
    { label: "Total Trades", value: reputation.totalTrades, color: "text-white", icon: <ArrowLeftRight className="w-4 h-4 text-white/40" /> },
    { label: "Successful", value: reputation.successfulTrades, color: "text-emerald-400", icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
    { label: "Disputed", value: reputation.disputedTrades, color: "text-red-400", icon: <AlertCircle className="w-4 h-4 text-red-400" /> },
    { label: "Cancelled", value: reputation.cancelledTrades, color: "text-white/35", icon: <Clock className="w-4 h-4 text-white/30" /> },
  ];

  return (
    <GlassCard>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-white/40" />
          <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Trade Statistics</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/3 border border-white/8">
              {s.icon}
              <div>
                <p className={cn("text-lg font-bold tabular-nums leading-none", s.color)}>{s.value}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Success rate bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-white/35 text-xs">Success Rate</span>
            <span className="text-emerald-400 text-xs font-bold">{successRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/8 to-cyan-500/8 border border-violet-500/15">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-white/50 text-xs">Total Volume</span>
          </div>
          <span className="text-violet-300 font-bold text-sm tabular-nums">
            {formatVolume(reputation.totalVolume)} UC
          </span>
        </div>

        {/* Avg rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarRating rating={reputation.avgRating} />
            <span className="text-white/60 text-sm font-semibold">{reputation.avgRating.toFixed(2)}</span>
          </div>
          <span className="text-white/30 text-xs">{reputation.reviewCount} reviews</span>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Community Panel ───────────────────────────────────────────────────────────

function CommunityPanel({ reputation }: { reputation: UserReputation }) {
  return (
    <GlassCard>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/40" />
          <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Community Standing</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Endorsements", value: reputation.endorsements, icon: <ThumbsUp className="w-4 h-4 text-cyan-400" />, color: "text-cyan-400" },
            { label: "Reviews", value: reputation.reviewCount, icon: <MessageSquare className="w-4 h-4 text-violet-400" />, color: "text-violet-400" },
            { label: "Reports", value: reputation.reports, icon: <AlertCircle className="w-4 h-4 text-red-400" />, color: reputation.reports > 0 ? "text-red-400" : "text-white/20" },
            { label: "Avg Rating", value: reputation.avgRating.toFixed(1), icon: <Star className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/3 border border-white/8">
              {s.icon}
              <div>
                <p className={cn("text-lg font-bold tabular-nums leading-none", s.color)}>{s.value}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-center">
          <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">Member Since</p>
          <p className="text-white/60 text-sm font-semibold">
            {new Date(reputation.joinedVerificationAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Trade History ─────────────────────────────────────────────────────────────

function TradeTypeIcon({ type }: { type: TradeRecord["type"] }) {
  const icons = {
    buy: <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />,
    sell: <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />,
    swap: <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />,
    transfer: <Send className="w-3.5 h-3.5 text-violet-400" />,
  };
  return icons[type];
}

function TradeRow({ trade }: { trade: TradeRecord }) {
  const [expanded, setExpanded] = useState(false);
  const result = TRADE_RESULT_META[trade.result];
  const typeInfo = TRADE_TYPE_META[trade.type];

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      trade.result === "disputed" ? "bg-red-500/5 border-red-500/15" :
      trade.result === "cancelled" ? "bg-white/2 border-white/6" :
      "bg-white/3 border-white/8 hover:border-white/15"
    )}>
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Type icon */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
          trade.type === "buy" ? "bg-emerald-500/10 border-emerald-500/20" :
          trade.type === "sell" ? "bg-red-500/10 border-red-500/20" :
          trade.type === "swap" ? "bg-cyan-500/10 border-cyan-500/20" :
          "bg-violet-500/10 border-violet-500/20"
        )}>
          <TradeTypeIcon type={trade.type} />
        </div>

        {/* Asset + counterparty */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white/80 text-sm font-medium truncate">{trade.asset}</span>
            <span className={cn("text-[10px] font-semibold", typeInfo.color)}>{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
              {trade.counterpartyAvatar.charAt(0)}
            </div>
            <span className="text-white/30 text-xs">{trade.counterparty}</span>
            <span className="text-white/15 text-xs">·</span>
            <span className="text-white/25 text-xs">{trade.worldName}</span>
          </div>
        </div>

        {/* Amount + result + time */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-white/70 text-sm font-semibold tabular-nums">
            {trade.amount.toLocaleString()} UC
          </span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md border", result.bg, result.border, result.color)}>
            {result.label}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 ml-1 shrink-0">
          <span className="text-white/20 text-[10px]">{timeAgo(trade.createdAt)}</span>
          {expanded ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/6 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: "Trade ID", value: trade.id },
                  { label: "World", value: trade.worldName },
                  { label: "Opened", value: new Date(trade.createdAt).toLocaleDateString() },
                  { label: "Closed", value: trade.completedAt ? new Date(trade.completedAt).toLocaleDateString() : "—" },
                ].map((d) => (
                  <div key={d.label}>
                    <span className="text-white/25 text-[10px]">{d.label}</span>
                    <p className="text-white/55 text-xs font-medium">{d.value}</p>
                  </div>
                ))}
              </div>

              {trade.rating && (
                <div className="flex items-center gap-2">
                  <StarRating rating={trade.rating} />
                  {trade.feedback && (
                    <span className="text-white/35 text-xs italic">"{trade.feedback}"</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Reviews Panel ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ReviewEntry }) {
  const catColors: Record<ReviewEntry["category"], string> = {
    marketplace: "text-emerald-400 border-emerald-500/20 bg-emerald-500/8",
    community: "text-cyan-400 border-cyan-500/20 bg-cyan-500/8",
    general: "text-violet-400 border-violet-500/20 bg-violet-500/8",
  };
  return (
    <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {review.fromAvatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/70 text-xs font-semibold">{review.fromUser}</span>
              {review.verified && <BadgeCheck className="w-3 h-3 text-cyan-400" />}
            </div>
            <span className="text-white/25 text-[10px]">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarRating rating={review.rating} />
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border capitalize font-medium", catColors[review.category])}>
            {review.category}
          </span>
        </div>
      </div>
      <p className="text-white/50 text-xs leading-relaxed">"{review.text}"</p>
    </div>
  );
}

// ── Identity Connect Banner ───────────────────────────────────────────────────

function IdentityBanner({ user }: { user: { username: string; email: string; level: number; securityScore: number; twoFactorEnabled: boolean; avatar: string } }) {
  return (
    <GlassCard className="border-violet-500/20">
      <div className="p-4 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{user.username}</span>
            <BadgeCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-white/40 text-xs">Identity Linked</span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">{user.email} · Level {user.level}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {[
            { label: "Security", value: `${user.securityScore}%`, ok: user.securityScore >= 60 },
            { label: "2FA", value: user.twoFactorEnabled ? "On" : "Off", ok: user.twoFactorEnabled },
          ].map((s) => (
            <div key={s.label} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs", s.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-white/5 border-white/10 text-white/30")}>
              {s.ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{s.label}: <strong>{s.value}</strong></span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "trades" | "reviews";

export default function ReputationPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [tradeFilter, setTradeFilter] = useState<TradeRecord["result"] | "all">("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGetUserReputation(user.id),
      apiGetUserTrades(user.id),
      apiGetUserReviews(user.id),
    ]).then(([rep, tr, rv]) => {
      setReputation(rep);
      setTrades(tr);
      setReviews(rv);
      setIsLoading(false);
    });
  }, [user]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const updated = await apiRefreshReputation(user.id);
      setReputation(updated);
      toast({ title: "Reputation refreshed", description: "Your scores have been recalculated." });
    } catch {
      toast({ title: "Error", description: "Failed to refresh reputation.", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || !reputation || !user) {
    return (
      <AppShell title="Reputation" subtitle="Your trust profile and community standing">
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AppShell>
    );
  }

  const filteredTrades = tradeFilter === "all" ? trades : trades.filter((t) => t.result === tradeFilter);
  const currentMeta = VERIFICATION_META[reputation.verificationLevel];

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "trades", label: "Trade History", count: trades.length },
    { key: "reviews", label: "Reviews", count: reviews.length },
  ];

  const TRADE_FILTERS: { key: TradeRecord["result"] | "all"; label: string }[] = [
    { key: "all", label: `All (${trades.length})` },
    { key: "completed", label: `Completed (${trades.filter((t) => t.result === "completed").length})` },
    { key: "disputed", label: `Disputed (${trades.filter((t) => t.result === "disputed").length})` },
    { key: "cancelled", label: `Cancelled (${trades.filter((t) => t.result === "cancelled").length})` },
  ];

  return (
    <AppShell title="Reputation" subtitle="Trust score, verification level, and trade standing">
      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── IDENTITY LINK BANNER ──────────────────────────────────── */}
          <motion.div variants={item}>
            <IdentityBanner user={user} />
          </motion.div>

          {/* ── STATS STRIP ───────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Overall Score", value: reputation.scores.overall, icon: <Award className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Avg Rating", value: reputation.avgRating.toFixed(2), icon: <Star className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
                { label: "Endorsements", value: reputation.endorsements, icon: <ThumbsUp className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                { label: "Total Volume", value: `${formatVolume(reputation.totalVolume)} UC`, icon: <Zap className="w-5 h-5" />, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              ].map((s) => (
                <div key={s.label} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", s.bg)}>
                  <span className={cn("shrink-0", s.color)}>{s.icon}</span>
                  <div>
                    <p className="text-white font-bold text-xl leading-none tabular-nums">{s.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── TABS ──────────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    tab === t.key
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md", tab === t.key ? "bg-violet-500/30 text-violet-300" : "bg-white/8 text-white/30")}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Verification level — full width */}
                <VerificationLevelCard reputation={reputation} />

                {/* 3-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ScoresPanel scores={reputation.scores} />
                  <TradeStatsPanel reputation={reputation} />
                  <CommunityPanel reputation={reputation} />
                </div>

                {/* Refresh button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    {isRefreshing ? "Refreshing…" : "Refresh Scores"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── TRADES TAB ────────────────────────────────────────── */}
            {tab === "trades" && (
              <motion.div
                key="trades"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit overflow-x-auto">
                  {TRADE_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setTradeFilter(f.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                        tradeFilter === f.key
                          ? f.key === "disputed" ? "bg-red-600/25 text-red-200 border border-red-500/35" :
                            f.key === "cancelled" ? "bg-white/15 text-white border border-white/20" :
                            "bg-emerald-600/25 text-emerald-200 border border-emerald-500/35"
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <GlassCard>
                  <div className="p-5 space-y-2.5">
                    {filteredTrades.length > 0 ? filteredTrades.map((t) => (
                      <TradeRow key={t.id} trade={t} />
                    )) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ArrowLeftRight className="w-8 h-8 text-white/15 mb-3" />
                        <p className="text-white/30 text-sm">No trades match this filter</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* ── REVIEWS TAB ───────────────────────────────────────── */}
            {tab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Summary */}
                <GlassCard>
                  <div className="p-5 flex items-center gap-6 flex-wrap">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-4xl font-bold text-white tabular-nums">{reputation.avgRating.toFixed(1)}</span>
                      <StarRating rating={reputation.avgRating} size="lg" />
                      <span className="text-white/30 text-xs">{reputation.reviewCount} reviews</span>
                    </div>
                    <div className="flex-1 min-w-48 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-white/30 text-xs w-2">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400/50" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-white/25 text-xs w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>

                <div className="space-y-3">
                  {reviews.length > 0 ? reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  )) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="w-8 h-8 text-white/15 mb-3" />
                      <p className="text-white/30 text-sm">No reviews yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AppShell>
  );
}
