import { describe, expect, it } from "vitest";
import { evolveEventsBetween, stageForLevel } from "../src/engine/evolution";

const gates = [10, 25, 40, 70];

describe("stageForLevel — 관문 10/25/40/70 경계", () => {
  it.each([
    [1, 1], [9, 1],
    [10, 2], [24, 2],
    [25, 3], [39, 3],
    [40, 4], [69, 4],
    [70, 5], [100, 5],
  ])("Lv.%i → %i단계", (level, stage) => {
    expect(stageForLevel(level, gates)).toBe(stage);
  });
});

describe("evolveEventsBetween", () => {
  it("관문 하나 통과 시 evolve 이벤트 1개", () => {
    expect(evolveEventsBetween("bitty", 9, 10, gates)).toEqual([
      { type: "evolve", speciesId: "bitty", stage: 2 },
    ]);
  });
  it("여러 관문을 건너뛰면 관문마다 이벤트가 생긴다", () => {
    const events = evolveEventsBetween("bitty", 8, 45, gates);
    expect(events.map((e) => e.stage)).toEqual([2, 3, 4]);
  });
  it("관문을 지나지 않으면 빈 배열", () => {
    expect(evolveEventsBetween("bitty", 10, 24, gates)).toEqual([]);
  });
});
