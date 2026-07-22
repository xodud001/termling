import { CreatureState, Curve } from "../types";

export function tokensToXp(
  tokens: number,
  remainder: number,
  tokensPerXp: number,
): { xp: number; remainder: number } {
  const total = tokens + remainder;
  return { xp: Math.floor(total / tokensPerXp), remainder: total % tokensPerXp };
}

export function xpNeededForLevel(n: number, curve: Curve): number {
  return Math.ceil(curve.xp.base * Math.pow(n, curve.xp.exponent));
}

export function cumulativeXpForLevel(level: number, curve: Curve): number {
  let sum = 0;
  for (let n = 1; n < level; n++) sum += xpNeededForLevel(n, curve);
  return sum;
}

export function applyXpToCreature(
  c: CreatureState,
  amount: number,
  curve: Curve,
): CreatureState {
  const totalXp = c.totalXp + amount;
  let level = c.level;
  while (level < curve.xp.maxLevel && totalXp >= cumulativeXpForLevel(level + 1, curve)) {
    level++;
  }
  return { ...c, totalXp, level };
}
