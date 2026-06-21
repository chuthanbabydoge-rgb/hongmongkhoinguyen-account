export type DeviceType = "desktop" | "mobile" | "tablet" | "vr" | "ar";

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: DeviceType;
  os: string;
  browser: string;
  trusted: boolean;
  lastSeen: string;
  registeredAt: string;
  ip?: string;
  location?: string;
  isCurrentDevice?: boolean;
}
