import { describe, expect, it } from "vitest";
import { DEFAULT_CURVE } from "../src/curve";
import {
  applyXpToCreature,
  cumulativeXpForLevel,
  tokensToXp,
  xpNeededForLevel,
} from "../src/engine/xp";

const curve = DEFAULT_CURVE;
const fresh = { level: 1, totalXp: 0, shiny: false, hatchCount: 0 };

describe("tokensToXp", () => {
  it("1000토큰 = 1XP, 잔여 토큰 이월", () => {
    expect(tokensToXp(2500, 0, 1000)).toEqual({ xp: 2, remainder: 500 });
  });
  it("이월분과 합산해 환산한다", () => {
    expect(tokensToXp(600, 500, 1000)).toEqual({ xp: 1, remainder: 100 });
  });
  it("0토큰이면 XP 0", () => {
    expect(tokensToXp(0, 999, 1000)).toEqual({ xp: 0, remainder: 999 });
  });
});

describe("레벨 곡선 (SPEC 3.2 예시값)", () => {
  it("필요 XP = ceil(10 × n^1.5)", () => {
    expect(xpNeededForLevel(1, curve)).toBe(10);
    expect(xpNeededForLevel(10, curve)).toBe(317);
    expect(xpNeededForLevel(50, curve)).toBe(3536);
    expect(xpNeededForLevel(99, curve)).toBe(9851);
  });
  it("누적 XP는 하위 레벨 필요치의 합", () => {
    expect(cumulativeXpForLevel(1, curve)).toBe(0);
    expect(cumulativeXpForLevel(2, curve)).toBe(10);
    expect(cumulativeXpForLevel(3, curve)).toBe(10 + 29);
  });
});

describe("applyXpToCreature", () => {
  it("XP 누적으로 레벨업한다", () => {
    const c = applyXpToCreature(fresh, 10, curve);
    expect(c.level).toBe(2);
    expect(c.totalXp).toBe(10);
  });
  it("한 번에 여러 레벨을 오를 수 있다", () => {
    const c = applyXpToCreature(fresh, 1000, curve);
    expect(c.level).toBeGreaterThan(5);
  });
  it("만렙 100에서 레벨은 멈추고 totalXp만 쌓인다", () => {
    const at99 = { ...fresh, level: 99, totalXp: cumulativeXpForLevel(99, curve) };
    const c = applyXpToCreature(at99, 9851 + 5000, curve);
    expect(c.level).toBe(100);
    const more = applyXpToCreature(c, 99999, curve);
    expect(more.level).toBe(100);
    expect(more.totalXp).toBe(c.totalXp + 99999);
  });
});
