import { ART } from "../art";
import { stageForLevel } from "../engine/evolution";
import { cumulativeXpForLevel, xpNeededForLevel } from "../engine/xp";
import { loadCurve } from "../store/curveFile";
import { readState } from "../store/stateFile";

export function runStatus(): void {
  const state = readState();
  if (!state) {
    console.log("`termling init`으로 시작하세요.");
    return;
  }
  const curve = loadCurve();
  const creature = state.creatures[state.activeId]!;
  const art = ART[state.activeId];
  const stage = stageForLevel(creature.level, curve.evolution.gates);

  console.log(art.stages[stage - 1].join("\n"));
  console.log();
  console.log(`${art.name}${creature.shiny ? " ✦" : ""}  Lv.${creature.level} (${stage}단계)`);
  if (creature.level < curve.xp.maxLevel) {
    const into = creature.totalXp - cumulativeXpForLevel(creature.level, curve);
    const need = xpNeededForLevel(creature.level, curve);
    console.log(`XP ${into}/${need} (누적 ${creature.totalXp})`);
  } else {
    console.log(`만렙! (누적 XP ${creature.totalXp})`);
  }
  if (state.egg) {
    console.log(`🥚 부화까지 ${curve.egg.hatchXp - state.egg.xp} XP`);
  }
}
