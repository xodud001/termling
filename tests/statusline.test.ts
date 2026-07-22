import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CURVE } from "../src/curve";
import { renderLine } from "../src/render";
import { extractTotalTokens, runStatusline, sessionDelta } from "../src/statusline";
import { writeState } from "../src/store/stateFile";
import { State } from "../src/types";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "termling-"));
  process.env.TERMLING_DIR = dir;
});
afterEach(() => {
  delete process.env.TERMLING_DIR;
  rmSync(dir, { recursive: true, force: true });
});

function sample(overrides: Partial<State> = {}): State {
  return {
    version: 1,
    activeId: "bitty",
    creatures: { bitty: { level: 12, totalXp: 1900, shiny: false, hatchCount: 0 } },
    egg: null,
    shinyUnlocked: false,
    tokenRemainder: 0,
    encounterTokens: 0,
    sessions: {},
    ...overrides,
  };
}

describe("extractTotalTokens", () => {
  it("cost의 *_tokens 숫자 필드를 전부 합산한다", () => {
    expect(
      extractTotalTokens({ cost: { total_input_tokens: 100, total_output_tokens: 50, total_cost_usd: 1.5 } }),
    ).toBe(150);
  });
  it("cost가 없거나 형태가 다르면 0", () => {
    expect(extractTotalTokens({})).toBe(0);
    expect(extractTotalTokens(null)).toBe(0);
    expect(extractTotalTokens({ cost: "x" })).toBe(0);
  });
});

describe("sessionDelta", () => {
  it("같은 세션의 누적치 증가분만 델타로 계산한다", () => {
    const s = sample();
    expect(sessionDelta(s, "a", 1000)).toBe(1000);
    expect(sessionDelta(s, "a", 1500)).toBe(500);
  });
  it("누적치가 줄었으면(비정상) 전체를 새 세션처럼 취급한다", () => {
    const s = sample({ sessions: { a: 9999 } });
    expect(sessionDelta(s, "a", 100)).toBe(100);
  });
  it("세션은 최근 20개만 유지한다", () => {
    const s = sample();
    for (let i = 0; i < 25; i++) sessionDelta(s, `sess-${i}`, 100);
    expect(Object.keys(s.sessions)).toHaveLength(20);
    expect(s.sessions["sess-0"]).toBeUndefined();
    expect(s.sessions["sess-24"]).toBe(100);
  });
});

describe("renderLine", () => {
  it("글리프·이름·레벨·바·퍼센트를 포함한다", () => {
    const line = renderLine(sample(), DEFAULT_CURVE, []);
    expect(line).toContain("비티");
    expect(line).toContain("Lv.12");
    expect(line).toMatch(/\[[█░]{8}\]/);
    expect(line).toMatch(/\d+%/);
  });
  it("알 보유 시 부화 진행률이 붙는다", () => {
    const line = renderLine(sample({ egg: { xp: 25 } }), DEFAULT_CURVE, []);
    expect(line).toContain("🥚50%");
  });
  it("진화 이벤트가 있으면 축하 문구가 붙는다", () => {
    const line = renderLine(sample(), DEFAULT_CURVE, [
      { type: "evolve", speciesId: "bitty", stage: 2 },
    ]);
    expect(line).toContain("진화");
  });
  it("만렙이면 100% 고정", () => {
    const s = sample({
      creatures: { bitty: { level: 100, totalXp: 999999, shiny: false, hatchCount: 0 } },
    });
    expect(renderLine(s, DEFAULT_CURVE, [])).toContain("100%");
  });
});

describe("runStatusline — 절대 깨지지 않는다", () => {
  it("쓰레기 입력에도 예외 없이 문자열을 출력한다", async () => {
    writeState(sample());
    const out = await runStatusline("이건 JSON이 아님{{{");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
  it("state가 없으면 init 안내를 출력한다", async () => {
    const out = await runStatusline("{}");
    expect(out).toContain("init");
  });
  it("정상 입력이면 XP를 반영해 저장한다", async () => {
    writeState(sample());
    const input = JSON.stringify({
      session_id: "s1",
      cost: { total_input_tokens: 40_000, total_output_tokens: 10_000 },
    });
    const out = await runStatusline(input);
    expect(out).toContain("비티");
    const { readState } = await import("../src/store/stateFile");
    expect(readState()!.creatures.bitty!.totalXp).toBe(1900 + 50);
    expect(readState()!.sessions["s1"]).toBe(50_000);
  });
});
