import { describe, expect, it } from "vitest";
import { DEFAULT_CURVE } from "../src/curve";
import { applyTokens } from "../src/engine";
import { cumulativeXpForLevel } from "../src/engine/xp";
import { State } from "../src/types";

const curve = DEFAULT_CURVE;

function baseState(overrides: Partial<State> = {}): State {
  return {
    version: 1,
    activeId: "bitty",
    creatures: { bitty: { level: 1, totalXp: 0, shiny: false, hatchCount: 0 } },
    egg: null,
    shinyUnlocked: false,
    tokenRemainder: 0,
    encounterTokens: 0,
    sessions: {},
    ...overrides,
  };
}

const never: () => number = () => 0.99; // 조우 실패, kern 추첨
const always: () => number = () => 0;   // 조우 성공, buggsy 추첨

describe("XP 적립", () => {
  it("토큰이 활성 크리처 XP가 되고 xp_gain 이벤트를 남긴다", () => {
    const { state, events } = applyTokens(baseState(), 10_000, curve, never);
    expect(state.creatures.bitty!.totalXp).toBe(10);
    expect(events).toContainEqual({ type: "xp_gain", amount: 10 });
  });
  it("잔여 토큰이 이월된다", () => {
    const { state } = applyTokens(baseState(), 1_500, curve, never);
    expect(state.tokenRemainder).toBe(500);
  });
  it("0 이하/비정상 토큰은 무시된다", () => {
    expect(applyTokens(baseState(), 0, curve, never).events).toEqual([]);
    expect(applyTokens(baseState(), NaN, curve, never).events).toEqual([]);
  });
  it("레벨업과 진화 이벤트가 발생한다", () => {
    const { state, events } = applyTokens(baseState(), 2_000_000, curve, never); // 2,000 XP → Lv.12 (관문 10 통과)
    expect(state.creatures.bitty!.level).toBeGreaterThanOrEqual(10);
    expect(events.some((e) => e.type === "level_up")).toBe(true);
    expect(events.some((e) => e.type === "evolve")).toBe(true);
  });
});

describe("조우와 부화", () => {
  it("10,000토큰마다 굴림, 성공 시 egg_found", () => {
    const { state, events } = applyTokens(baseState(), 10_000, curve, always);
    expect(state.egg).toEqual({ xp: 0 });
    expect(events).toContainEqual({ type: "egg_found" });
  });
  it("10,000토큰 미만이면 굴림 없이 누적만 된다", () => {
    const { state } = applyTokens(baseState(), 9_999, curve, always);
    expect(state.egg).toBeNull();
    expect(state.encounterTokens).toBe(9_999);
  });
  it("알 보유 중에는 조우 판정이 없다", () => {
    const s = baseState({ egg: { xp: 0 } });
    const { state } = applyTokens(s, 20_000, curve, always);
    expect(state.encounterTokens).toBe(0); // 누적 자체를 안 함
  });
  it("알은 활성 크리처와 동시에 XP를 받고 50 XP에 부화한다", () => {
    const s = baseState({ egg: { xp: 45 } });
    const { state, events } = applyTokens(s, 5_000, curve, never); // +5 XP → 50
    expect(state.egg).toBeNull();
    expect(state.creatures.kern).toMatchObject({ level: 1, hatchCount: 1 });
    expect(events).toContainEqual({ type: "hatch", speciesId: "kern", shiny: false, dupe: false });
    expect(state.creatures.bitty!.totalXp).toBe(5); // 활성 몫은 그대로
  });
  it("중복 부화 시 활성 크리처에게 보너스 500 XP", () => {
    const s = baseState({
      egg: { xp: 49 },
      creatures: {
        bitty: { level: 1, totalXp: 0, shiny: false, hatchCount: 0 },
        kern: { level: 3, totalXp: 60, shiny: false, hatchCount: 1 },
      },
    });
    const { state, events } = applyTokens(s, 1_000, curve, never);
    expect(state.creatures.kern!.hatchCount).toBe(2);
    expect(state.creatures.bitty!.totalXp).toBe(1 + 500);
    expect(events).toContainEqual({ type: "hatch", speciesId: "kern", shiny: false, dupe: true });
  });
});

describe("샤이니", () => {
  it("최초 Lv.100 달성 시 shiny_unlock 이벤트 (1회만)", () => {
    const at99 = baseState({
      creatures: { bitty: { level: 99, totalXp: cumulativeXpForLevel(99, curve), shiny: false, hatchCount: 0 } },
    });
    const { state, events } = applyTokens(at99, 20_000_000, curve, never);
    expect(state.creatures.bitty!.level).toBe(100);
    expect(state.shinyUnlocked).toBe(true);
    expect(events.filter((e) => e.type === "shiny_unlock")).toHaveLength(1);
    // 이미 해금된 상태에선 다시 발생하지 않음
    const again = applyTokens(state, 1_000_000, curve, never);
    expect(again.events.some((e) => e.type === "shiny_unlock")).toBe(false);
  });
  it("해금 후 부화는 5% 확률로 샤이니", () => {
    const s = baseState({ shinyUnlocked: true, egg: { xp: 49 } });
    // rng 호출 순서: 추첨(0.99→kern), 샤이니(0.01<0.05→성공)
    const rolls = [0.99, 0.01];
    const rng = () => rolls.shift() ?? 0.99;
    const { state } = applyTokens(s, 1_000, curve, rng);
    expect(state.creatures.kern!.shiny).toBe(true);
  });
  it("보유 종이 샤이니로 부화하면 승격, 중복 보너스 없음", () => {
    const s = baseState({
      shinyUnlocked: true,
      egg: { xp: 49 },
      creatures: {
        bitty: { level: 1, totalXp: 0, shiny: false, hatchCount: 0 },
        kern: { level: 40, totalXp: 30_000, shiny: false, hatchCount: 1 },
      },
    });
    const rolls = [0.99, 0.01]; // kern, 샤이니 성공
    const rng = () => rolls.shift() ?? 0.99;
    const { state } = applyTokens(s, 1_000, curve, rng);
    expect(state.creatures.kern!.shiny).toBe(true);
    expect(state.creatures.kern!.level).toBe(40); // 레벨 유지
    expect(state.creatures.bitty!.totalXp).toBe(1); // 보너스 없음
  });
});

describe("불변성", () => {
  it("입력 상태를 변경하지 않는다", () => {
    const s = baseState();
    const copy = structuredClone(s);
    applyTokens(s, 50_000, curve, always);
    expect(s).toEqual(copy);
  });
});
