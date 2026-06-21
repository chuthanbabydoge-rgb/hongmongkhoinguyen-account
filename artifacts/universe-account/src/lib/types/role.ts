export type RoleId = "admin" | "moderator" | "creator" | "premium_user" | "standard_user";

export type PermissionId =
  | "create_worlds"
  | "manage_marketplace"
  | "create_football_clubs"
  | "breed_animals"
  | "trade_assets"
  | "manage_communities";

export interface Permission {
  id: PermissionId;
  label: string;
  description: string;
  category: "World" | "Economy" | "Social" | "Marketplace";
  icon: string;
  risk: "low" | "medium" | "high";
}

export interface Role {
  id: RoleId;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  badgeGradient: string;
  icon: string;
  level: number;
  userCount: number;
  permissions: PermissionId[];
}

export type RoleMatrix = Record<RoleId, PermissionId[]>;
