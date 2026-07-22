import { describe, expect, it } from "vitest";
import { ART } from "../src/art";
import { SPECIES_ORDER } from "../src/types";

describe("art 데이터", () => {
  it("6종 전부 글리프·이름·5단계 아트를 가진다", () => {
    for (const id of SPECIES_ORDER) {
      const art = ART[id];
      expect(art.glyph.length).toBeGreaterThan(0);
      expect(art.name.length).toBeGreaterThan(0);
      expect(art.stages).toHaveLength(5);
      for (const stage of art.stages) {
        expect(stage.length).toBeGreaterThan(0); // 각 단계는 1줄 이상
      }
    }
  });
});
