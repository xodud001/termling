import { homedir } from "node:os";
import { join } from "node:path";

export function dataDir(): string {
  return process.env.TERMLING_DIR ?? join(homedir(), ".termling");
}

export const statePath = (): string => join(dataDir(), "state.json");
export const eventsPath = (): string => join(dataDir(), "events.jsonl");
export const userCurvePath = (): string => join(dataDir(), "curve.json");
