import { useState, useEffect, useCallback } from "react";
import { roleStore } from "@/lib/store/roleStore";
import { RoleMatrix, PermissionId, RoleId } from "@/lib/types/role";
import { PERMISSIONS, ROLES } from "@/lib/mock/rolesMock";

export function useRoles() {
  const [matrix, setMatrix] = useState<RoleMatrix>(() => roleStore.getMatrix());
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    return roleStore.subscribe(() => setMatrix(roleStore.getMatrix()));
  }, []);

  const toggle = useCallback(async (roleId: RoleId, permId: PermissionId) => {
    const key = `${roleId}:${permId}`;
    setSaving(key);
    await new Promise(r => setTimeout(r, 280));
    roleStore.toggle(roleId, permId);
    setSaving(null);
  }, []);

  const grantAll = useCallback(async (roleId: RoleId) => {
    setSaving(`${roleId}:all`);
    await new Promise(r => setTimeout(r, 350));
    roleStore.grantAll(roleId, PERMISSIONS.map(p => p.id));
    setSaving(null);
  }, []);

  const revokeAll = useCallback(async (roleId: RoleId) => {
    setSaving(`${roleId}:none`);
    await new Promise(r => setTimeout(r, 350));
    roleStore.revokeAll(roleId);
    setSaving(null);
  }, []);

  const reset = useCallback(async () => {
    setSaving("reset");
    await new Promise(r => setTimeout(r, 400));
    roleStore.reset();
    setSaving(null);
  }, []);

  const hasPermission = useCallback((roleId: RoleId, permId: PermissionId): boolean => {
    return (matrix[roleId] ?? []).includes(permId);
  }, [matrix]);

  return {
    matrix,
    roles: ROLES,
    permissions: PERMISSIONS,
    saving,
    toggle,
    grantAll,
    revokeAll,
    reset,
    hasPermission,
  };
}
