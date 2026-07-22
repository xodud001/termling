import { ART } from "../art";
import { readState } from "../store/stateFile";
import { SPECIES_ORDER } from "../types";

export function runDex(): void {
  const state = readState();
  if (!state) {
    console.log("`termling init`으로 시작하세요.");
    return;
  }
  console.log("── 털링 도감 ──");
  for (const id of SPECIES_ORDER) {
    const owned = state.creatures[id];
    const art = ART[id];
    if (!owned) {
      console.log(`  ?  ???  (미발견)`);
      continue;
    }
    const shiny = owned.shiny ? " ✦" : "";
    const active = state.activeId === id ? " ←활성" : "";
    const hatched = owned.hatchCount > 0 ? ` 부화×${owned.hatchCount}` : "";
    console.log(`  ${art.glyph} ${art.name}${shiny} Lv.${owned.level}${hatched}${active}`);
  }
}
