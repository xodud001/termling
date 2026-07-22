import { applyTokens } from "./engine";
import { fallbackLine, renderLine } from "./render";
import { loadCurve } from "./store/curveFile";
import { appendEvents } from "./store/eventLog";
import { readState, writeState } from "./store/stateFile";
import { State } from "./types";

const MAX_SESSIONS = 20;

export function extractTotalTokens(input: unknown): number {
  const cost = (input as { cost?: unknown } | null)?.cost;
  if (!cost || typeof cost !== "object") return 0;
  let sum = 0;
  for (const [key, value] of Object.entries(cost)) {
    if (key.endsWith("_tokens") && typeof value === "number" && Number.isFinite(value)) {
      sum += value;
    }
  }
  return sum;
}

export function sessionDelta(state: State, sessionId: string, total: number): number {
  const last = state.sessions[sessionId] ?? 0;
  const delta = total >= last ? total - last : total;
  state.sessions[sessionId] = total;
  const keys = Object.keys(state.sessions);
  while (keys.length > MAX_SESSIONS) {
    delete state.sessions[keys.shift()!];
  }
  return delta;
}

/** stdin 문자열을 받아 한 줄을 반환한다. 어떤 입력에도 throw하지 않는다. */
export async function runStatusline(rawInput: string): Promise<string> {
  let line = fallbackLine();
  try {
    const state = readState();
    if (!state) return line;
    const curve = loadCurve();
    line = renderLine(state, curve, []); // 마지막 정상 상태 (이후 실패 시 이 줄 반환)

    const input = JSON.parse(rawInput);
    const sessionId = typeof input?.session_id === "string" ? input.session_id : "unknown";
    const tokens = sessionDelta(state, sessionId, extractTotalTokens(input));

    const { state: next, events } = applyTokens(state, tokens, curve, Math.random);
    next.sessions = state.sessions; // sessionDelta가 갱신한 최신 맵 유지
    writeState(next);
    appendEvents(events);
    line = renderLine(next, curve, events);
  } catch {
    // 원칙: statusline은 절대 깨지지 않는다 — 마지막 정상 line 유지
  }
  return line;
}

export function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    setTimeout(() => resolve(data), 500).unref(); // stdin이 안 닫혀도 멈추지 않는다
  });
}
