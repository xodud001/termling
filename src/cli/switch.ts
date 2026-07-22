import { ART } from "../art";
import { readState, writeState } from "../store/stateFile";
import { SpeciesId } from "../types";

export function runSwitch(target: string | undefined): void {
  const state = readState();
  if (!state) {
    console.log("`termling init`으로 시작하세요.");
    return;
  }
  const owned = Object.keys(state.creatures) as SpeciesId[];
  if (!target || !owned.includes(target as SpeciesId)) {
    console.log(`사용법: termling switch <id>  (보유: ${owned.join(", ")})`);
    return;
  }
  state.activeId = target as SpeciesId;
  writeState(state);
  console.log(`활성 크리처를 ${ART[state.activeId].name}(으)로 교체했습니다.`);
}
