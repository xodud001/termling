import { ART } from "./art";
import { cumulativeXpForLevel, xpNeededForLevel } from "./engine/xp";
import { Curve, GameEvent, State } from "./types";

const BAR_SLOTS = 8;

export function renderLine(state: State, curve: Curve, events: GameEvent[]): string {
  const creature = state.creatures[state.activeId];
  const art = ART[state.activeId];
  if (!creature || !art) return fallbackLine();

  let pct = 100;
  if (creature.level < curve.xp.maxLevel) {
    const into = creature.totalXp - cumulativeXpForLevel(creature.level, curve);
    const need = xpNeededForLevel(creature.level, curve);
    pct = Math.min(99, Math.floor((into / need) * 100));
  }
  const filled = Math.min(BAR_SLOTS, Math.floor((pct / 100) * BAR_SLOTS));
  const bar = "█".repeat(filled) + "░".repeat(BAR_SLOTS - filled);

  const name = creature.shiny ? `\x1b[95m${art.name}✦\x1b[0m` : art.name;
  let line = `${art.glyph} ${name} Lv.${creature.level} [${bar}] ${pct}%`;

  if (state.egg) {
    const eggPct = Math.min(99, Math.floor((state.egg.xp / curve.egg.hatchXp) * 100));
    line += ` 🥚${eggPct}%`;
  }

  // 축하 문구는 이번 업데이트의 이벤트에만 붙는다 → 자연스럽게 1회 한정 (SPEC 7장)
  if (events.some((e) => e.type === "shiny_unlock")) line += " ✦ 샤이니 해금!";
  if (events.some((e) => e.type === "hatch" && e.shiny)) line += " 🐣✦ 샤이니 부화!";
  else if (events.some((e) => e.type === "hatch")) line += " 🐣 부화!";
  if (events.some((e) => e.type === "evolve")) line += " ✨ 진화!";
  if (events.some((e) => e.type === "egg_found")) line += " 🥚 알 발견!";

  return line;
}

export function fallbackLine(): string {
  return "(?) termling — `termling init` 필요";
}
