import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { State } from "../types";
import { dataDir, statePath } from "./paths";

export function readState(): State | null {
  try {
    const parsed = JSON.parse(readFileSync(statePath(), "utf8"));
    if (parsed?.version !== 1) return null;
    return parsed as State;
  } catch {
    return null;
  }
}

export function writeState(state: State): void {
  mkdirSync(dataDir(), { recursive: true });
  const tmp = statePath() + ".tmp";
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, statePath()); // 원자적 교체 (SPEC 부록 A)
}
