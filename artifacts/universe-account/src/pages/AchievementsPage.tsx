import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  UserAchievement,
  RARITY_META,
  CATEGORY_META,
} from "@/lib/types/achievement";
import {
  apiGetAllAchievements,
  apiGetUserAchievements,
  apiUnlockAchievement,
} from "@/lib/services/achievementService";
import {
  Trophy,
  Star,
  Lock,
  Sparkles,
  Filter,
  Zap,
  Gift,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animations ────────────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── Achievement Card ──────────────────────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  userRecord?: UserAchievement;
  onUnlock: (id: string) => Promise<void>;
  unlocking: string | null;
}

function AchievementCard({
  achievement,
  userRecord,
  onUnlock,
  unlocking,
}: AchievementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rarity = RARITY_META[achievement.rarity];
  const category = CATEGORY_META[achievement.category];
  const isUnlocked = userRecord?.isUnlocked ?? false;
  const progress = userRecord?.progress ?? 0;
  const pct = Math.min(100, Math.round((progress / achievement.maxProgress) * 100));
  const isUnlocking = unlocking === achievement.id;
  const isSecret = achievement.secret && !isUnlocked;

  return (
    <motion.div variants={item} layout>
      <GlassCard
        className={cn(
          "overflow-hidden flex flex-col transition-all duration-300",
          isUnlocked
            ? `${rarity.border} ${rarity.glow}`
            : "border-white/8 opacity-70 hover:opacity-90"
        )}
      >
        {/* Top accent gradient */}
        {isUnlocked && (
          <div
            className={`h-0.5 bg-gradient-to-r ${rarity.gradient} opacity-80`}
          />
        )}

        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon bubble */}
              <div
                className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border transition-all",
                  isUnlocked ? `${rarity.bg} ${rarity.border}` : "bg-white/5 border-white/10"
                )}
              >
                {isSecret ? "🔒" : achievement.icon}
                {isUnlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-[#050c1a] flex items-center justify-center"
                  >
                    <Star className="w-2.5 h-2.5 text-white fill-white" />
                  </motion.div>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={cn(
                    "font-semibold text-sm leading-tight",
                    isSecret ? "text-white/30 italic" : "text-white"
                  )}
                >
                  {isSecret ? "???" : achievement.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {/* Category pill */}
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-md border",
                      category.bg,
                      category.border,
                      category.color
                    )}
                  >
                    {category.icon} {category.label}
                  </span>
                  {/* Rarity pill */}
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                      rarity.bg,
                      rarity.border,
                      rarity.color
                    )}
                  >
                    {rarity.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Points badge */}
            <div
              className={cn(
                "shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl border text-xs font-bold",
                isUnlocked
                  ? `${rarity.bg} ${rarity.border} ${rarity.color}`
                  : "bg-white/5 border-white/10 text-white/20"
              )}
            >
              <span className="leading-none">{rarity.points}</span>
              <span className="text-[9px] leading-none mt-0.5 font-normal opacity-70">
                pts
              </span>
            </div>
          </div>

          {/* Description */}
          {!isSecret && (
            <p className="text-white/45 text-xs leading-relaxed">
              {achievement.description}
            </p>
          )}

          {/* Progress bar */}
          {!isSecret && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-[10px]">Progress</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    isUnlocked ? rarity.color : "text-white/40"
                  )}
                >
                  {progress.toLocaleString()} / {achievement.maxProgress.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    isUnlocked
                      ? achievement.rarity === "legendary"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : achievement.rarity === "epic"
                        ? "bg-gradient-to-r from-violet-400 to-purple-500"
                        : achievement.rarity === "rare"
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                        : "bg-gradient-to-r from-slate-300 to-slate-400"
                      : "bg-gradient-to-r from-white/20 to-white/10"
                  )}
                />
              </div>
            </div>
          )}

          {/* Expandable details */}
          {isUnlocked && !isSecret && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-white/25 hover:text-white/50 text-[10px] transition-all self-start"
              >
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {expanded ? "Hide details" : "Show details"}
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
                    <div className="pt-2 border-t border-white/8 space-y-2">
                      <div className="flex items-start gap-2">
                        <Gift className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-white/30 text-[10px]">
                            Reward
                          </span>
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              rarity.color
                            )}
                          >
                            {achievement.reward.label}:{" "}
                            {achievement.reward.value}
                          </p>
                        </div>
                      </div>
                      {userRecord?.unlockedAt && (
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-white/30 shrink-0" />
                          <span className="text-white/30 text-[10px]">
                            Unlocked {timeAgo(userRecord.unlockedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Unlock button for demo */}
          {!isUnlocked && !isSecret && pct >= 100 && (
            <button
              onClick={() => onUnlock(achievement.id)}
              disabled={!!isUnlocking}
              className={cn(
                "mt-auto flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all",
                "bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border-violet-500/30 hover:border-violet-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isUnlocking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trophy className="w-3.5 h-3.5" />
              )}
              Claim Reward
            </button>
          )}

          {/* Locked state */}
          {!isUnlocked && pct < 100 && (
            <div className="mt-auto flex items-center gap-1.5 text-white/20 text-[10px]">
              <Lock className="w-3 h-3" />
              <span>{isSecret ? "Hidden achievement" : `${100 - pct}% remaining`}</span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", bg)}>
      <span className={cn("shrink-0", color)}>{icon}</span>
      <div>
        <p className="text-white font-bold text-xl leading-none tabular-nums">
          {value}
        </p>
        <p className="text-white/35 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type CategoryFilter = "all" | AchievementCategory;
type RarityFilter = "all" | AchievementRarity;

export default function AchievementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userRecords, setUserRecords] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiGetAllAchievements(),
      apiGetUserAchievements(user.id),
    ]).then(([all, records]) => {
      setAchievements(all);
      setUserRecords(records);
      setIsLoading(false);
    });
  }, [user]);

  const handleUnlock = async (achievementId: string) => {
    if (!user) return;
    setUnlocking(achievementId);
    try {
      const updated = await apiUnlockAchievement(user.id, achievementId);
      setUserRecords((prev) =>
        prev.map((r) =>
          r.achievementId === achievementId ? updated : r
        )
      );
      const ach = achievements.find((a) => a.id === achievementId);
      toast({
        title: "Achievement Unlocked! 🏆",
        description: `${ach?.title} — ${RARITY_META[ach?.rarity ?? "common"].points} points earned`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unlock achievement.",
        variant: "destructive",
      });
    } finally {
      setUnlocking(null);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────

  const unlockedCount = userRecords.filter((r) => r.isUnlocked).length;
  const totalPoints = userRecords
    .filter((r) => r.isUnlocked)
    .reduce((sum, r) => {
      const ach = achievements.find((a) => a.id === r.achievementId);
      return sum + (ach ? RARITY_META[ach.rarity].points : 0);
    }, 0);
  const maxPoints = achievements.reduce(
    (sum, a) => sum + RARITY_META[a.rarity].points,
    0
  );
  const legendaryCount = userRecords.filter((r) => {
    if (!r.isUnlocked) return false;
    const ach = achievements.find((a) => a.id === r.achievementId);
    return ach?.rarity === "legendary";
  }).length;

  const completionPct =
    achievements.length > 0
      ? Math.round((unlockedCount / achievements.length) * 100)
      : 0;

  // ── Filtered list ───────────────────────────────────────────────────────

  const filtered = achievements.filter((a) => {
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (rarityFilter !== "all" && a.rarity !== rarityFilter) return false;
    if (showOnlyUnlocked) {
      const rec = userRecords.find((r) => r.achievementId === a.id);
      if (!rec?.isUnlocked) return false;
    }
    return true;
  });

  // sort: unlocked first, then by rarity weight
  const rarityOrder: AchievementRarity[] = ["legendary", "epic", "rare", "common"];
  const sorted = [...filtered].sort((a, b) => {
    const aRec = userRecords.find((r) => r.achievementId === a.id);
    const bRec = userRecords.find((r) => r.achievementId === b.id);
    const aUnlocked = aRec?.isUnlocked ? 1 : 0;
    const bUnlocked = bRec?.isUnlocked ? 1 : 0;
    if (bUnlocked !== aUnlocked) return bUnlocked - aUnlocked;
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  // Category counts for filter tabs
  const categoryCounts: Record<string, number> = { all: achievements.length };
  for (const ach of achievements) {
    categoryCounts[ach.category] = (categoryCounts[ach.category] ?? 0) + 1;
  }

  const CATEGORIES: CategoryFilter[] = [
    "all",
    "explorer",
    "trader",
    "creator",
    "collector",
    "breeder",
    "football_manager",
  ];
  const RARITIES: RarityFilter[] = ["all", "common", "rare", "epic", "legendary"];

  if (isLoading) {
    return (
      <AppShell title="Achievements" subtitle="Your cosmic milestones & badges">
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Achievements"
      subtitle="Track your cosmic milestones, earn badges, and climb the ranks"
    >
      <div className="p-4 sm:p-6 max-w-7xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── DASHBOARD STATS ───────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill
                icon={<Trophy className="w-5 h-5" />}
                label="Unlocked"
                value={`${unlockedCount}/${achievements.length}`}
                color="text-amber-400"
                bg="bg-amber-500/10 border-amber-500/20"
              />
              <StatPill
                icon={<Zap className="w-5 h-5" />}
                label="Total Points"
                value={totalPoints.toLocaleString()}
                color="text-violet-400"
                bg="bg-violet-500/10 border-violet-500/20"
              />
              <StatPill
                icon={<Star className="w-5 h-5" />}
                label="Legendary"
                value={legendaryCount}
                color="text-orange-400"
                bg={legendaryCount > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-white/5 border-white/10"}
              />
              <StatPill
                icon={<Sparkles className="w-5 h-5" />}
                label="Completion"
                value={`${completionPct}%`}
                color="text-cyan-400"
                bg="bg-cyan-500/10 border-cyan-500/20"
              />
            </div>
          </motion.div>

          {/* ── OVERALL PROGRESS BAR ──────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">Overall Progress</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {unlockedCount} of {achievements.length} achievements unlocked · {totalPoints.toLocaleString()} / {maxPoints.toLocaleString()} points
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-2xl tabular-nums">{completionPct}%</p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500"
                  />
                </div>

                {/* Per-rarity breakdown */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(["legendary", "epic", "rare", "common"] as AchievementRarity[]).map((r) => {
                    const total = achievements.filter((a) => a.rarity === r).length;
                    const unlocked = userRecords.filter((rec) => {
                      if (!rec.isUnlocked) return false;
                      const ach = achievements.find((a) => a.id === rec.achievementId);
                      return ach?.rarity === r;
                    }).length;
                    const meta = RARITY_META[r];
                    return (
                      <div
                        key={r}
                        className={cn(
                          "flex flex-col items-center gap-1 py-2 px-3 rounded-xl border",
                          meta.bg,
                          meta.border
                        )}
                      >
                        <span className={cn("text-base font-bold tabular-nums", meta.color)}>
                          {unlocked}/{total}
                        </span>
                        <span className="text-white/35 text-[10px] capitalize">{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── CATEGORY BADGES ───────────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard>
              <div className="p-5">
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-3">
                  Achievement Categories
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {(
                    [
                      "explorer",
                      "trader",
                      "creator",
                      "collector",
                      "breeder",
                      "football_manager",
                    ] as AchievementCategory[]
                  ).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const total = achievements.filter(
                      (a) => a.category === cat
                    ).length;
                    const unlocked = userRecords.filter((rec) => {
                      if (!rec.isUnlocked) return false;
                      const ach = achievements.find(
                        (a) => a.id === rec.achievementId
                      );
                      return ach?.category === cat;
                    }).length;
                    const pct =
                      total > 0 ? Math.round((unlocked / total) * 100) : 0;
                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setCategoryFilter(
                            categoryFilter === cat ? "all" : cat
                          )
                        }
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all group",
                          categoryFilter === cat
                            ? `${meta.bg} ${meta.border}`
                            : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
                        )}
                      >
                        <span className="text-2xl">{meta.icon}</span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold text-center leading-tight",
                            categoryFilter === cat
                              ? meta.color
                              : "text-white/40"
                          )}
                        >
                          {meta.label}
                        </span>
                        <div className="w-full">
                          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                meta.bg.replace("/10", "/60")
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-center text-white/20 text-[9px] mt-1">
                            {unlocked}/{total}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── FILTERS TOOLBAR ───────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-2"
          >
            {/* Category tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const meta = cat !== "all" ? CATEGORY_META[cat] : null;
                const label =
                  cat === "all"
                    ? `All (${achievements.length})`
                    : `${meta!.icon} ${meta!.label}`;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                      categoryFilter === cat
                        ? "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Rarity filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {RARITIES.map((r) => {
                const meta = r !== "all" ? RARITY_META[r] : null;
                return (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(r)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize",
                      rarityFilter === r
                        ? r !== "all"
                          ? `${meta!.bg} ${meta!.text} border ${meta!.border}`
                          : "bg-white/15 text-white border border-white/20"
                        : "text-white/35 hover:text-white/60"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Unlocked toggle */}
            <button
              onClick={() => setShowOnlyUnlocked((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
                showOnlyUnlocked
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Unlocked only
            </button>

            <span className="ml-auto text-white/25 text-xs">
              {sorted.length} achievement{sorted.length !== 1 ? "s" : ""}
            </span>
          </motion.div>

          {/* ── ACHIEVEMENT GRID ──────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((achievement) => {
                const rec = userRecords.find(
                  (r) => r.achievementId === achievement.id
                );
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    userRecord={rec}
                    onUnlock={handleUnlock}
                    unlocking={unlocking}
                  />
                );
              })}
            </AnimatePresence>

            {sorted.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium">
                  No achievements match your filters
                </p>
                <p className="text-white/20 text-xs mt-1">
                  Try adjusting the category or rarity filter
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </AppShell>
  );
}
