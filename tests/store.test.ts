import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendEvents } from "../src/store/eventLog";
import { loadCurve } from "../src/store/curveFile";
import { readState, writeState } from "../src/store/stateFile";
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

const sample: State = {
  version: 1,
  activeId: "bitty",
  creatures: { bitty: { level: 1, totalXp: 0, shiny: false, hatchCount: 0 } },
  egg: null,
  shinyUnlocked: false,
  tokenRemainder: 0,
  encounterTokens: 0,
  sessions: {},
};

describe("stateFile", () => {
  it("라운드트립: 쓰고 읽으면 동일하다", () => {
    writeState(sample);
    expect(readState()).toEqual(sample);
  });
  it("파일이 없으면 null", () => {
    expect(readState()).toBeNull();
  });
  it("손상된 JSON이면 null (예외를 던지지 않는다)", () => {
    writeFileSync(join(dir, "state.json"), "{broken!!");
    expect(readState()).toBeNull();
  });
  it("버전이 다르면 null", () => {
    writeFileSync(join(dir, "state.json"), JSON.stringify({ version: 99 }));
    expect(readState()).toBeNull();
  });
});

describe("eventLog", () => {
  it("이벤트마다 version/ts가 붙은 JSONL로 append된다", () => {
    appendEvents([{ type: "egg_found" }, { type: "xp_gain", amount: 5 }]);
    appendEvents([{ type: "shiny_unlock" }]);
    const lines = readFileSync(join(dir, "events.jsonl"), "utf8").trim().split("\n");
    expect(lines).toHaveLength(3);
    const first = JSON.parse(lines[0]);
    expect(first.version).toBe(1);
    expect(first.type).toBe("egg_found");
    expect(typeof first.ts).toBe("string");
  });
  it("빈 배열이면 파일을 만들지 않는다", () => {
    appendEvents([]);
    expect(() => readFileSync(join(dir, "events.jsonl"))).toThrow();
  });
});

describe("curveFile", () => {
  it("사용자 오버라이드가 없으면 기본값", () => {
    expect(loadCurve().egg.hatchXp).toBe(50);
  });
  it("사용자 curve.json이 딥 병합된다", () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "curve.json"), JSON.stringify({ egg: { hatchXp: 5 } }));
    const c = loadCurve();
    expect(c.egg.hatchXp).toBe(5);
    expect(c.egg.encounterRate).toBe(0.02);
  });
  it("손상된 사용자 curve.json은 무시하고 기본값", () => {
    writeFileSync(join(dir, "curve.json"), "not json");
    expect(loadCurve().egg.hatchXp).toBe(50);
  });
});
