import { describe, expect, it } from "vitest";
import { DEFAULT_CURVE, mergeCurve } from "../src/curve";

describe("curve", () => {
  it("기본값이 SPEC과 일치한다", () => {
    expect(DEFAULT_CURVE.xp.tokensPerXp).toBe(1000);
    expect(DEFAULT_CURVE.evolution.gates).toEqual([10, 25, 40, 70]);
    expect(DEFAULT_CURVE.egg.hatchXp).toBe(50);
    expect(DEFAULT_CURVE.shiny.rate).toBe(0.05);
  });

  it("키 단위 딥 병합 — 지정한 키만 덮어쓴다", () => {
    const merged = mergeCurve(DEFAULT_CURVE, { egg: { encounterRate: 0.5 } });
    expect(merged.egg.encounterRate).toBe(0.5);
    expect(merged.egg.hatchXp).toBe(50); // 나머지 유지
    expect(merged.xp.base).toBe(10);
  });

  it("배열(gates)은 통째로 교체된다", () => {
    const merged = mergeCurve(DEFAULT_CURVE, { evolution: { gates: [2, 3] } });
    expect(merged.evolution.gates).toEqual([2, 3]);
  });

  it("잘못된 오버라이드 형태는 무시된다", () => {
    expect(mergeCurve(DEFAULT_CURVE, null)).toEqual(DEFAULT_CURVE);
    expect(mergeCurve(DEFAULT_CURVE, undefined)).toEqual(DEFAULT_CURVE);
  });

  it("__proto__/constructor 키는 병합에서 무시된다", () => {
    const merged = mergeCurve(DEFAULT_CURVE, JSON.parse('{"__proto__":{"hacked":true},"xp":{"base":7}}'));
    expect(merged.xp.base).toBe(7);
    expect((merged as Record<string, unknown>)["hacked"]).toBeUndefined();
    expect(({} as Record<string, unknown>)["hacked"]).toBeUndefined();
  });
});
