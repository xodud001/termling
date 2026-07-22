import { appendFileSync, mkdirSync } from "node:fs";
import { GameEvent } from "../types";
import { dataDir, eventsPath } from "./paths";

export function appendEvents(events: GameEvent[]): void {
  if (events.length === 0) return;
  mkdirSync(dataDir(), { recursive: true });
  const lines = events
    .map((e) => JSON.stringify({ version: 1, ts: new Date().toISOString(), ...e }))
    .join("\n");
  appendFileSync(eventsPath(), lines + "\n");
}
