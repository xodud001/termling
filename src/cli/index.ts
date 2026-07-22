#!/usr/bin/env node
import { readStdin, runStatusline } from "../statusline";
import { runDex } from "./dex";
import { runInit } from "./init";
import { runStatus } from "./status";
import { runSwitch } from "./switch";

async function main(): Promise<void> {
  const command = process.argv[2];
  switch (command) {
    case "init":
      await runInit();
      break;
    case "status":
      runStatus();
      break;
    case "dex":
      runDex();
      break;
    case "switch":
      runSwitch(process.argv[3]);
      break;
    case "statusline":
      process.stdout.write(await runStatusline(await readStdin()));
      break;
    default:
      console.log("사용법: termling <init|status|dex|switch [id]>");
  }
}

main();
