import { Rng, SpeciesId } from "../types";

export function drawSpecies(weights: Record<string, number>, rng: Rng): SpeciesId {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [id, w] of entries) {
    if (r < w) return id as SpeciesId;
    r -= w;
  }
  return entries[entries.length - 1][0] as SpeciesId;
}
