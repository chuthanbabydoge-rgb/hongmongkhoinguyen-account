import { Notification, NotificationCategory, NotificationType, NotificationPriority } from "../types/notification";

let counter = 1000;
function uid() { return `notif-${++counter}`; }

function n(
  userId: string,
  category: NotificationCategory,
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  body: string,
  minsAgo: number,
  isRead = false,
  actionLabel?: string,
  actionUrl?: string
): Notification {
  return {
    id: uid(),
    userId,
    category,
    type,
    priority,
    title,
    body,
    isRead,
    isDeleted: false,
    actionLabel,
    actionUrl,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
    readAt: isRead ? new Date(Date.now() - (minsAgo - 1) * 60000).toISOString() : undefined,
  };
}

export const initialNotifications: Notification[] = [
  // ── Admin notifications ──────────────────────────────────────────────────
  n("user-admin", "safepass", "warning", "urgent", "Suspicious Login Attempt", "A login was attempted from an unrecognized device in São Paulo, Brazil. If this wasn't you, revoke access immediately.", 2, false, "Review Devices", "/devices"),
  n("user-admin", "identity", "success", "high", "Diamond Verification Achieved", "Your identity has been upgraded to Diamond tier. You now have access to all governance and elite marketplace features.", 15, false, "View Reputation", "/reputation"),
  n("user-admin", "exchange", "info", "high", "Large Trade Completed", "Your sale of Cosmic Artifact for 98,000 UC has been confirmed. Funds have been credited to your wallet.", 47, false, "Trade History", "/reputation"),
  n("user-admin", "football", "announcement", "medium", "Season 12 Begins", "Football Universe Season 12 is now live. Your squad has been seeded in Division 1 based on your Diamond reputation.", 120, false, "View Squad", "/"),
  n("user-admin", "system", "info", "medium", "Platform Maintenance Completed", "Scheduled maintenance on the Quantum Forge cluster has been completed. All services are running normally.", 180, true),
  n("user-admin", "animals", "success", "medium", "Rare Evolution Unlocked", "Your Stellar Dragon has evolved to Tier 5 — Cosmic form. This evolution was triggered by your milestone of 100+ successful trades.", 240, true, "View Creature", "/"),
  n("user-admin", "worlds", "info", "low", "World Rating Updated", "Nebula Nexus has been rated ⭐⭐⭐⭐⭐ by 34 new visitors this week. Your world is trending in the Explorer category.", 360, true),
  n("user-admin", "safepass", "success", "medium", "2FA Authentication Enabled", "Two-factor authentication has been successfully enabled on your account. Your SafePass rating has increased by +8 points.", 480, true),
  n("user-admin", "identity", "info", "low", "Profile Endorsement Received", "CelestialK has endorsed your trading reputation. Your endorsement count is now 142.", 720, true),
  n("user-admin", "exchange", "warning", "high", "Trade Dispute Opened", "VoidRunner has opened a dispute on trade #tr-a008. A moderator will review within 24 hours.", 1440, true, "View Dispute", "/reputation"),
  n("user-admin", "system", "announcement", "medium", "New Feature: Reputation System", "The Universe Reputation System is now live. Check your Trust Score, Marketplace Rating, and Verification Level.", 2880, true, "View Reputation", "/reputation"),
  n("user-admin", "football", "success", "low", "Match Result: 3-1 Victory", "Your team won 3-1 against Void Rangers in the Quarter Finals. Your squad rating increased by +2.", 4320, true),
  n("user-admin", "worlds", "warning", "medium", "World Capacity Warning", "Crystal Matrix is at 94% capacity. Consider upgrading your hosting tier to avoid performance issues.", 5760, true, "Upgrade World", "/"),
  n("user-admin", "animals", "info", "low", "Daily Breeding Result", "Breeding attempt successful: Neon Fox × Stellar Wolf produced a Rare Aurora Hybrid. Check your collection.", 7200, true),
  n("user-admin", "safepass", "info", "low", "Session Expired", "Your session on Mobile Device was automatically ended after 7 days of inactivity.", 10080, true),

  // ── Creator notifications ────────────────────────────────────────────────
  n("user-creator", "exchange", "success", "high", "Asset Sale Confirmed", "Your Art Module sold for 3,200 UC. Payment has been credited to your wallet.", 30, false, "View Trades", "/reputation"),
  n("user-creator", "safepass", "warning", "high", "Weak Password Detected", "Your current password was found in a known breach database. Please update it immediately.", 90, false, "Change Password", "/security-center"),
  n("user-creator", "identity", "info", "medium", "Gold Verification Maintained", "Your identity verification has been renewed for another 90 days. Keep up your trade activity to progress to Platinum.", 200, false),
  n("user-creator", "worlds", "success", "medium", "New World Follower", "GlowMesh has started following your World Creator portfolio. You now have 38 followers.", 310, true),
  n("user-creator", "system", "announcement", "medium", "Achievement System Launched", "You've unlocked 12 achievements so far. Check the Achievements page to see your progress.", 500, true, "View Achievements", "/achievements"),
  n("user-creator", "football", "info", "low", "Transfer Window Open", "The Summer Transfer Window is now open. You can sign up to 3 new players before matchday.", 800, true),
  n("user-creator", "exchange", "warning", "high", "Dispute Filed Against You", "RiftCraft has filed a dispute on trade #tr-c004. Please respond within 48 hours with evidence.", 1200, true, "Respond to Dispute", "/reputation"),
  n("user-creator", "animals", "success", "low", "Evolution Milestone", "Your collection has reached 25 creatures. You've unlocked the Collector Bronze achievement.", 2000, true),
  n("user-creator", "identity", "success", "medium", "New Endorsement", "SkyNode has endorsed your community contributions. Total endorsements: 38.", 3000, true),

  // ── Regular user notifications ────────────────────────────────────────────
  n("user-regular", "system", "announcement", "high", "Welcome to Universe!", "Your account is set up and ready. Start by exploring your Account Center and completing your profile.", 60, false, "Account Center", "/account-center"),
  n("user-regular", "safepass", "warning", "urgent", "Enable 2FA Now", "Your account does not have two-factor authentication enabled. Enable it to boost your SafePass rating and secure your account.", 120, false, "Enable 2FA", "/security-center"),
  n("user-regular", "identity", "info", "medium", "Bronze Verification Active", "You're currently at Bronze verification level. Complete more trades to progress toward Silver.", 200, false, "View Reputation", "/reputation"),
  n("user-regular", "exchange", "success", "medium", "First Trade Completed", "Congratulations on completing your first trade! You've earned the First Steps achievement.", 400, true),
  n("user-regular", "football", "info", "low", "Welcome to Football Universe", "You've been registered for the current season. Your starting squad awaits your tactical setup.", 600, true, "Set Up Squad", "/"),
];

// ── Realtime notification pool ─────────────────────────────────────────────

export type LiveNotifTemplate = {
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionLabel?: string;
};

export const liveNotifPool: LiveNotifTemplate[] = [
  { category: "exchange", type: "success", priority: "medium", title: "Trade Offer Received", body: "A buyer has offered 2,400 UC for your Quantum Shard listing. Accept or counter within 24h.", actionLabel: "View Offer" },
  { category: "safepass", type: "info", priority: "low", title: "Security Score Updated", body: "Your SafePass rating was recalculated. Check your Security Center for the latest breakdown." },
  { category: "identity", type: "info", priority: "low", title: "Profile Viewed", body: "12 users viewed your reputation profile in the last 24 hours." },
  { category: "football", type: "announcement", priority: "medium", title: "Match Starting Soon", body: "Your Football Universe match begins in 15 minutes. Confirm your starting lineup now.", actionLabel: "Set Lineup" },
  { category: "animals", type: "success", priority: "low", title: "Breeding Complete", body: "Your breeding session has completed. Visit Animal Evolution to collect your new creature.", actionLabel: "Collect Now" },
  { category: "worlds", type: "info", priority: "low", title: "World Activity Spike", body: "Nebula Nexus received 89 visitors in the last hour — a new record for this week." },
  { category: "system", type: "warning", priority: "medium", title: "Storage Limit Approaching", body: "Your account is at 87% storage capacity. Consider archiving old data or upgrading your plan." },
  { category: "exchange", type: "warning", priority: "high", title: "Price Alert Triggered", body: "Nebula Crystal dropped below your alert threshold of 3,000 UC. Current price: 2,870 UC.", actionLabel: "View Market" },
  { category: "identity", type: "success", priority: "medium", title: "New Endorsement!", body: "A community member endorsed your marketplace reputation. Keep up the great work!" },
  { category: "safepass", type: "warning", priority: "high", title: "New Device Login", body: "A new device signed into your account. If this wasn't you, review your active sessions now.", actionLabel: "Review Sessions" },
  { category: "football", type: "success", priority: "low", title: "Match Result Available", body: "Your Football Universe match has ended. Tap to see the final score and player ratings." },
  { category: "worlds", type: "success", priority: "low", title: "World Milestone: 1,000 Visitors", body: "Your world has been visited 1,000 times total. A new achievement has been unlocked!" },
];
