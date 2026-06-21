import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useRoles } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { Role, Permission, RoleId, PermissionId } from "@/lib/types/role";
import {
  CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp,
  ShieldCheck, ShieldOff, Loader2, Users, Lock, Unlock,
  Sparkles, LayoutGrid, Edit3, AlertTriangle, Info,
} from "lucide-react";

// ─── Animations ───────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

// ─── Risk badge ───────────────────────────────────────────────────────────────
const RISK_META = {
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  high: { label: "High", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const CATEGORY_META: Record<string, { color: string; bg: string }> = {
  World: { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  Economy: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  Social: { color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  Marketplace: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

// ─── Toggle cell ──────────────────────────────────────────────────────────────
function ToggleCell({
  enabled,
  loading,
  onToggle,
  role,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
  role: Role;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 group disabled:opacity-60 ${
        enabled
          ? `${role.bgColor} ${role.borderColor} ${role.glowColor}`
          : "bg-white/3 border-white/8 hover:bg-white/8 hover:border-white/15"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
      ) : enabled ? (
        <CheckCircle2 className={`w-4.5 h-4.5 ${role.textColor}`} />
      ) : (
        <XCircle className="w-4 h-4 text-white/20 group-hover:text-white/35 transition-colors" />
      )}
    </button>
  );
}

// ─── Role stat card ───────────────────────────────────────────────────────────
function RoleCard({ role, permCount, totalPerms, selected, onClick }: {
  role: Role;
  permCount: number;
  totalPerms: number;
  selected: boolean;
  onClick: () => void;
}) {
  const pct = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 rounded-2xl border p-4 ${
        selected
          ? `${role.bgColor} ${role.borderColor} ${role.glowColor}`
          : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${role.bgColor} ${role.borderColor}`}>
          {role.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${selected ? role.textColor : "text-white/80"}`}>{role.label}</p>
          <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            {role.userCount.toLocaleString()} users
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-white/35 text-xs">Permissions</span>
          <span className={`text-xs font-bold tabular-nums ${selected ? role.textColor : "text-white/60"}`}>
            {permCount}/{totalPerms}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${role.badgeGradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Matrix view ──────────────────────────────────────────────────────────────
function MatrixView({ roles, permissions, hasPermission, saving, toggle }: {
  roles: Role[];
  permissions: Permission[];
  hasPermission: (roleId: RoleId, permId: PermissionId) => boolean;
  saving: string | null;
  toggle: (roleId: RoleId, permId: PermissionId) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr>
            <th className="text-left pb-4 pr-4 w-56">
              <span className="text-white/30 text-xs font-medium uppercase tracking-wider">Permission</span>
            </th>
            {roles.map(role => (
              <th key={role.id} className="pb-4 px-2 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${role.bgColor} ${role.borderColor}`}>
                    {role.icon}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${role.textColor}`}>{role.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {permissions.map(perm => {
            const cat = CATEGORY_META[perm.category];
            const risk = RISK_META[perm.risk];
            return (
              <tr key={perm.id} className="group hover:bg-white/2 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0 mt-0.5">{perm.icon}</span>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{perm.label}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${cat.color} ${cat.bg}`}>
                          {perm.category}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${risk.color} ${risk.bg}`}>
                          {risk.label} risk
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                {roles.map(role => {
                  const enabled = hasPermission(role.id, perm.id);
                  const key = `${role.id}:${perm.id}`;
                  return (
                    <td key={role.id} className="py-3 px-2 text-center">
                      <div className="flex justify-center">
                        <ToggleCell
                          enabled={enabled}
                          loading={saving === key}
                          onToggle={() => toggle(role.id, perm.id)}
                          role={role}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Permission editor (single role focused) ──────────────────────────────────
function PermissionEditor({ role, permissions, hasPermission, saving, toggle, grantAll, revokeAll }: {
  role: Role;
  permissions: Permission[];
  hasPermission: (roleId: RoleId, permId: PermissionId) => boolean;
  saving: string | null;
  toggle: (roleId: RoleId, permId: PermissionId) => void;
  grantAll: (roleId: RoleId) => void;
  revokeAll: (roleId: RoleId) => void;
}) {
  const enabledCount = permissions.filter(p => hasPermission(role.id, p.id)).length;
  const isGrantingAll = saving === `${role.id}:all`;
  const isRevokingAll = saving === `${role.id}:none`;

  const byCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    acc[p.category] = acc[p.category] ?? [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <GlassCard className={`border ${role.borderColor} ${role.glowColor}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${role.bgColor} ${role.borderColor} ${role.glowColor}`}>
              {role.icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${role.textColor}`}>{role.label}</h3>
              <p className="text-white/40 text-xs mt-0.5 max-w-xs">{role.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => grantAll(role.id)}
              disabled={!!saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/35 transition-all disabled:opacity-50"
            >
              {isGrantingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
              Grant All
            </button>
            <button
              onClick={() => revokeAll(role.id)}
              disabled={!!saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/8 hover:bg-red-500/15 text-red-400/70 hover:text-red-300 border border-red-500/15 hover:border-red-500/25 transition-all disabled:opacity-50"
            >
              {isRevokingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Revoke All
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5 p-3.5 rounded-xl bg-white/3 border border-white/8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs">Permission coverage</span>
            <span className={`text-sm font-bold tabular-nums ${role.textColor}`}>
              {enabledCount} / {permissions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${role.badgeGradient}`}
              animate={{ width: `${(enabledCount / permissions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Permissions by category */}
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, perms]) => {
            const cat = CATEGORY_META[category];
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${cat.color} ${cat.bg}`}>
                    {category}
                  </span>
                </div>
                <div className="space-y-2">
                  {perms.map(perm => {
                    const enabled = hasPermission(role.id, perm.id);
                    const isLoading = saving === `${role.id}:${perm.id}`;
                    const risk = RISK_META[perm.risk];
                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                          enabled
                            ? `${role.bgColor} ${role.borderColor}`
                            : "bg-white/2 border-white/6 hover:bg-white/4"
                        }`}
                      >
                        <span className="text-xl shrink-0">{perm.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${enabled ? role.textColor : "text-white/60"}`}>
                              {perm.label}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${risk.color} ${risk.bg}`}>
                              {risk.label}
                            </span>
                          </div>
                          <p className="text-white/30 text-xs mt-0.5 truncate">{perm.description}</p>
                        </div>
                        <button
                          onClick={() => toggle(role.id, perm.id)}
                          disabled={isLoading}
                          className={`relative shrink-0 w-11 h-6 rounded-full border transition-all duration-300 disabled:opacity-60 ${
                            enabled
                              ? `bg-gradient-to-r ${role.badgeGradient} border-transparent shadow-[0_0_8px_rgba(255,255,255,0.15)]`
                              : "bg-white/8 border-white/15"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white/60 absolute inset-0 m-auto" />
                          ) : (
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                              enabled ? "left-[calc(100%-22px)]" : "left-0.5"
                            }`} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type ViewMode = "matrix" | "editor";

export default function RolesPage() {
  const { roles, permissions, matrix, hasPermission, saving, toggle, grantAll, revokeAll, reset } = useRoles();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>("admin");
  const [resetConfirm, setResetConfirm] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId)!;

  const handleReset = async () => {
    await reset();
    setResetConfirm(false);
    toast({ title: "Permissions reset", description: "All roles have been restored to default settings." });
  };

  const handleToggle = async (roleId: RoleId, permId: PermissionId) => {
    await toggle(roleId, permId);
    const perm = permissions.find(p => p.id === permId);
    const role = roles.find(r => r.id === roleId);
    const nowEnabled = !hasPermission(roleId, permId);
    toast({
      title: nowEnabled ? "Permission granted" : "Permission revoked",
      description: `${perm?.label} ${nowEnabled ? "enabled" : "disabled"} for ${role?.label}`,
    });
  };

  const handleGrantAll = async (roleId: RoleId) => {
    const role = roles.find(r => r.id === roleId);
    await grantAll(roleId);
    toast({ title: "All permissions granted", description: `${role?.label} now has full access.` });
  };

  const handleRevokeAll = async (roleId: RoleId) => {
    const role = roles.find(r => r.id === roleId);
    await revokeAll(roleId);
    toast({ title: "All permissions revoked", description: `${role?.label} access cleared.` });
  };

  const totalPerms = permissions.length;

  return (
    <AppShell title="Roles & Permissions" subtitle="Manage access control for all platform roles">
      <div className="p-4 sm:p-6 max-w-7xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── STATS ──────────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Roles", value: roles.length, icon: ShieldCheck, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                { label: "Total Permissions", value: permissions.length, icon: Lock, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
                { label: "Total Users", value: roles.reduce((s, r) => s + r.userCount, 0).toLocaleString(), icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Active Assignments", value: Object.values(matrix).flat().length, icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
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

          {/* ── TOOLBAR ────────────────────────────────────────────────── */}
          <motion.div variants={item} className="flex items-center justify-between gap-3 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
              {([
                { key: "matrix", label: "Matrix View", Icon: LayoutGrid },
                { key: "editor", label: "Permission Editor", Icon: Edit3 },
              ] as const).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    viewMode === key
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Reset */}
            <div className="flex items-center gap-2">
              {resetConfirm ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300 text-xs">Reset all permissions?</span>
                  <button
                    onClick={handleReset}
                    disabled={saving === "reset"}
                    className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition-all font-medium"
                  >
                    {saving === "reset" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                  </button>
                  <button onClick={() => setResetConfirm(false)} className="text-white/30 hover:text-white/60 text-xs transition-all">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
              )}
            </div>
          </motion.div>

          {/* ── CONTENT ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {viewMode === "matrix" ? (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Role cards row */}
                <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                  {roles.map(role => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      permCount={(matrix[role.id] ?? []).length}
                      totalPerms={totalPerms}
                      selected={false}
                      onClick={() => { setSelectedRoleId(role.id); setViewMode("editor"); }}
                    />
                  ))}
                </motion.div>

                {/* Matrix table */}
                <motion.div variants={item}>
                  <GlassCard>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <LayoutGrid className="w-4 h-4 text-violet-400" />
                        <h3 className="text-white font-semibold text-sm">Permission Matrix</h3>
                        <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-lg bg-white/5 border border-white/8">
                          <Info className="w-3 h-3 text-white/30" />
                          <span className="text-white/30 text-xs">Click any cell to toggle</span>
                        </div>
                      </div>
                      <MatrixView
                        roles={roles}
                        permissions={permissions}
                        hasPermission={hasPermission}
                        saving={saving}
                        toggle={handleToggle}
                      />
                    </div>
                  </GlassCard>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5"
              >
                {/* Role selector sidebar */}
                <div className="space-y-2">
                  <p className="text-white/30 text-xs font-medium uppercase tracking-wider px-1 mb-3">Select Role</p>
                  {roles.map(role => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      permCount={(matrix[role.id] ?? []).length}
                      totalPerms={totalPerms}
                      selected={selectedRoleId === role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                    />
                  ))}
                </div>

                {/* Editor panel */}
                <PermissionEditor
                  role={selectedRole}
                  permissions={permissions}
                  hasPermission={hasPermission}
                  saving={saving}
                  toggle={handleToggle}
                  grantAll={handleGrantAll}
                  revokeAll={handleRevokeAll}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AppShell>
  );
}
