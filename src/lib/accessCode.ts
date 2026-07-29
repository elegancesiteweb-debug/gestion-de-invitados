import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoid = customAlphabet(ALPHABET, 8);

export function generateAccessCode(accountType: "INDIVIDUAL" | "PLANNER"): string {
  const prefix = accountType === "PLANNER" ? "PLN" : "IND";
  return `${prefix}-${nanoid()}`;
}
