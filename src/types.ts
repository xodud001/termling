export type SpeciesId = "bitty" | "cursy" | "shelly" | "buggsy" | "daemo" | "kern";

export const SPECIES_ORDER: SpeciesId[] = ["bitty", "cursy", "shelly", "buggsy", "daemo", "kern"];
export const STARTERS: SpeciesId[] = ["bitty", "cursy", "shelly"];

export interface CreatureState {
  level: number;
  totalXp: number;
  shiny: boolean;
  hatchCount: number;
}

export interface State {
  version: 1;
  activeId: SpeciesId;
  creatures: Partial<Record<SpeciesId, CreatureState>>;
  egg: { xp: number } | null;
  shinyUnlocked: boolean;
  tokenRemainder: number;
  encounterTokens: number;
  sessions: Record<string, number>;
}

export type GameEvent =
  | { type: "xp_gain"; amount: number }
  | { type: "level_up"; speciesId: SpeciesId; from: number; to: number }
  | { type: "evolve"; speciesId: SpeciesId; stage: number }
  | { type: "egg_found" }
  | { type: "hatch"; speciesId: SpeciesId; shiny: boolean; dupe: boolean }
  | { type: "shiny_unlock" };

export interface Curve {
  xp: { tokensPerXp: number; base: number; exponent: number; maxLevel: number };
  evolution: { gates: number[] };
  egg: {
    rollPerTokens: number;
    encounterRate: number;
    hatchXp: number;
    dupeBonusXp: number;
    speciesWeights: Record<string, number>;
  };
  shiny: { rate: number };
}

export type Rng = () => number;
