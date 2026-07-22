import { Curve, GameEvent, Rng, SpeciesId, State } from "../types";
import { drawSpecies } from "./egg";
import { evolveEventsBetween } from "./evolution";
import { applyXpToCreature, tokensToXp } from "./xp";

export interface ApplyResult {
  state: State;
  events: GameEvent[];
}

export function applyTokens(prev: State, tokens: number, curve: Curve, rng: Rng): ApplyResult {
  const state = structuredClone(prev);
  const events: GameEvent[] = [];
  if (!Number.isFinite(tokens) || tokens <= 0) return { state, events };

  const hadEggAtStart = state.egg !== null;

  const { xp, remainder } = tokensToXp(tokens, state.tokenRemainder, curve.xp.tokensPerXp);
  state.tokenRemainder = remainder;

  if (xp > 0) {
    events.push({ type: "xp_gain", amount: xp });
    grantXp(state, state.activeId, xp, curve, events);

    if (state.egg) {
      state.egg.xp += xp;
      if (state.egg.xp >= curve.egg.hatchXp) hatch(state, curve, rng, events);
    }
  }

  if (!hadEggAtStart && state.egg === null) {
    state.encounterTokens += tokens;
    let rolls = Math.floor(state.encounterTokens / curve.egg.rollPerTokens);
    state.encounterTokens -= rolls * curve.egg.rollPerTokens;
    while (rolls-- > 0) {
      if (rng() < curve.egg.encounterRate) {
        state.egg = { xp: 0 };
        events.push({ type: "egg_found" });
        break; // 알은 동시에 1개만
      }
    }
  }

  return { state, events };
}

function grantXp(state: State, id: SpeciesId, amount: number, curve: Curve, events: GameEvent[]): void {
  const creature = state.creatures[id];
  if (!creature) return;
  const before = creature.level;
  const after = applyXpToCreature(creature, amount, curve);
  state.creatures[id] = after;
  if (after.level > before) {
    events.push({ type: "level_up", speciesId: id, from: before, to: after.level });
    events.push(...evolveEventsBetween(id, before, after.level, curve.evolution.gates));
    if (after.level >= curve.xp.maxLevel && !state.shinyUnlocked) {
      state.shinyUnlocked = true;
      events.push({ type: "shiny_unlock" });
    }
  }
}

function hatch(state: State, curve: Curve, rng: Rng, events: GameEvent[]): void {
  state.egg = null;
  const id = drawSpecies(curve.egg.speciesWeights, rng);
  const shiny = state.shinyUnlocked && rng() < curve.shiny.rate;
  const existing = state.creatures[id];

  if (!existing) {
    state.creatures[id] = { level: 1, totalXp: 0, shiny, hatchCount: 1 };
    events.push({ type: "hatch", speciesId: id, shiny, dupe: false });
    return;
  }

  existing.hatchCount += 1;
  if (shiny && !existing.shiny) {
    // 샤이니 승격: 레벨·XP 유지, 중복 보너스 없음 (SPEC 6장)
    existing.shiny = true;
    events.push({ type: "hatch", speciesId: id, shiny: true, dupe: true });
  } else {
    events.push({ type: "hatch", speciesId: id, shiny: false, dupe: true });
    grantXp(state, state.activeId, curve.egg.dupeBonusXp, curve, events);
  }
}
