import { RoleMatrix, PermissionId, RoleId } from "../types/role";
import { INITIAL_ROLE_MATRIX } from "../mock/rolesMock";

const STORAGE_KEY = "universe_role_matrix";

function loadMatrix(): RoleMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RoleMatrix;
  } catch {}
  return structuredClone(INITIAL_ROLE_MATRIX);
}

function saveMatrix(matrix: RoleMatrix) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  } catch {}
}

let _matrix: RoleMatrix = loadMatrix();
const _listeners = new Set<() => void>();

export const roleStore = {
  getMatrix(): RoleMatrix {
    return _matrix;
  },

  toggle(roleId: RoleId, permId: PermissionId): void {
    const perms = [...(_matrix[roleId] ?? [])];
    const idx = perms.indexOf(permId);
    if (idx === -1) {
      perms.push(permId);
    } else {
      perms.splice(idx, 1);
    }
    _matrix = { ..._matrix, [roleId]: perms };
    saveMatrix(_matrix);
    _listeners.forEach(fn => fn());
  },

  grantAll(roleId: RoleId, allPermIds: PermissionId[]): void {
    _matrix = { ..._matrix, [roleId]: [...allPermIds] };
    saveMatrix(_matrix);
    _listeners.forEach(fn => fn());
  },

  revokeAll(roleId: RoleId): void {
    _matrix = { ..._matrix, [roleId]: [] };
    saveMatrix(_matrix);
    _listeners.forEach(fn => fn());
  },

  reset(): void {
    _matrix = structuredClone(INITIAL_ROLE_MATRIX);
    saveMatrix(_matrix);
    _listeners.forEach(fn => fn());
  },

  subscribe(fn: () => void): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
