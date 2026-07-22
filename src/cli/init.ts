import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { ART } from "../art";
import { readState, writeState } from "../store/stateFile";
import { SpeciesId, STARTERS, State } from "../types";

export async function runInit(): Promise<void> {
  if (readState()) {
    console.log("이미 시작된 게임이 있습니다. (~/.termling/state.json)");
    return;
  }

  console.log("스타터를 선택하세요:\n");
  STARTERS.forEach((id, i) => {
    const art = ART[id];
    console.log(`  ${i + 1}. ${art.glyph} ${art.name} (${id})`);
  });

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("\n번호 입력 (1-3): ");
  rl.close();

  const index = Number.parseInt(answer, 10) - 1;
  const chosen: SpeciesId | undefined = STARTERS[index];
  if (!chosen) {
    console.log("1~3 중에서 선택해 주세요.");
    process.exitCode = 1;
    return;
  }

  const state: State = {
    version: 1,
    activeId: chosen,
    creatures: { [chosen]: { level: 1, totalXp: 0, shiny: false, hatchCount: 0 } },
    egg: null,
    shinyUnlocked: false,
    tokenRemainder: 0,
    encounterTokens: 0,
    sessions: {},
  };
  writeState(state);
  registerStatusline();
  console.log(`\n${ART[chosen].name}와(과) 함께 시작합니다! statusline이 등록되었습니다.`);
}

function registerStatusline(): void {
  const settingsPath = join(homedir(), ".claude", "settings.json");
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      console.log(`경고: ${settingsPath} 파싱 실패 — statusline을 수동 등록하세요.`);
      return;
    }
  }
  settings.statusLine = {
    type: "command",
    command: `node ${process.argv[1]} statusline`,
  };
  mkdirSync(join(homedir(), ".claude"), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}
