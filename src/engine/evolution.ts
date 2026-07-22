import { GameEvent, SpeciesId } from "../types";

export function stageForLevel(level: number, gates: number[]): number {
  let stage = 1;
  for (const g of gates) if (level >= g) stage++;
  return stage;
}

export function evolveEventsBetween(
  speciesId: SpeciesId,
  from: number,
  to: number,
  gates: number[],
): Extract<GameEvent, { type: "evolve" }>[] {
  return gates
    .filter((g) => from < g && to >= g)
    .map((g) => ({ type: "evolve" as const, speciesId, stage: stageForLevel(g, gates) }));
}
