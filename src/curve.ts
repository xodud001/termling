import defaults from "../curve.json";
import { Curve } from "./types";

export const DEFAULT_CURVE: Curve = defaults as Curve;

export function mergeCurve(base: Curve, override: unknown): Curve {
  return deepMerge(base, override) as Curve;
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined || override === null) return base;
  if (
    typeof override !== "object" ||
    Array.isArray(override) ||
    typeof base !== "object" ||
    base === null ||
    Array.isArray(base)
  ) {
    return override;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k], v);
  }
  return out;
}
