const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateUniverseId(): string {
  let result = "UNI-";
  for (let i = 0; i < 8; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export function isValidUniverseId(id: string): boolean {
  return /^UNI-[A-Z0-9]{8}$/.test(id);
}

export function formatUniverseId(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.startsWith("UNI")) {
    const body = clean.slice(3).slice(0, 8);
    return body.length > 0 ? `UNI-${body}` : "UNI-";
  }
  return `UNI-${clean.slice(0, 8)}`;
}

export function reputationRankFromScore(score: number): "Newcomer" | "Explorer" | "Pioneer" | "Guardian" | "Legend" | "Cosmic" {
  if (score >= 95) return "Cosmic";
  if (score >= 80) return "Legend";
  if (score >= 65) return "Guardian";
  if (score >= 45) return "Pioneer";
  if (score >= 25) return "Explorer";
  return "Newcomer";
}

export function xpProgress(xp: number, toNext: number): number {
  return Math.min(Math.round((xp / toNext) * 100), 100);
}
