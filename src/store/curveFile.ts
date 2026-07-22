import { readFileSync } from "node:fs";
import { DEFAULT_CURVE, mergeCurve } from "../curve";
import { Curve } from "../types";
import { userCurvePath } from "./paths";

export function loadCurve(): Curve {
  try {
    return mergeCurve(DEFAULT_CURVE, JSON.parse(readFileSync(userCurvePath(), "utf8")));
  } catch {
    return DEFAULT_CURVE;
  }
}
