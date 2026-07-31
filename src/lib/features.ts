import type { AccountType } from "@prisma/client";

// Funciones "principales" disponibles para el plan Particular (INDIVIDUAL).
export const PARTICULAR_FEATURES = [
  "checklist",
  "budget_basic",
  "dietary_preferences",
  "reminders",
  "event_page",
] as const;

// Funciones adicionales que solo se activan con el plan Wedding Planner.
export const PLANNER_FEATURES = [
  "day_timeline",
  "vendor_directory",
  "multi_event_dashboard",
  "style_guide",
  "reusable_templates",
  "client_portal",
  "crm_leads",
  "crm_proposals",
  "crm_contracts",
  "crm_invoicing",
  "own_integrations",
  "own_branding",
  "team_accounts",
  "business_reports",
  "crm_packages",
  "document_library",
] as const;

export type FeatureKey =
  | (typeof PARTICULAR_FEATURES)[number]
  | (typeof PLANNER_FEATURES)[number];

const PARTICULAR_SET: ReadonlySet<string> = new Set(PARTICULAR_FEATURES);

// PLANNER ve todo (Particular + Planner); INDIVIDUAL solo ve las de Particular.
export function hasFeature(accountType: AccountType, feature: FeatureKey): boolean {
  if (accountType === "PLANNER") return true;
  return PARTICULAR_SET.has(feature);
}
