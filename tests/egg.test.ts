import { describe, expect, it } from "vitest";
import { drawSpecies } from "../src/engine/egg";

const weights = { buggsy: 60, daemo: 30, kern: 10 };

describe("drawSpecies — 가중 추첨 (합 100 기준 경계)", () => {
  it("rng < 0.6 → buggsy", () => {
    expect(drawSpecies(weights, () => 0)).toBe("buggsy");
    expect(drawSpecies(weights, () => 0.599)).toBe("buggsy");
  });
  it("0.6 ≤ rng < 0.9 → daemo", () => {
    expect(drawSpecies(weights, () => 0.6)).toBe("daemo");
    expect(drawSpecies(weights, () => 0.899)).toBe("daemo");
  });
  it("0.9 ≤ rng → kern", () => {
    expect(drawSpecies(weights, () => 0.9)).toBe("kern");
    expect(drawSpecies(weights, () => 0.999)).toBe("kern");
  });
});
