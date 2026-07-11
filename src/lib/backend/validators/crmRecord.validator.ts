import { z } from "zod";
import type { CrmRecord } from "../types/crm";

const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

const crmRecordSchema = z.object({
  created_at: z.string().refine(
    (value) => value === "" || !isNaN(new Date(value).getTime()),
    { message: "created_at is not a valid date" }
  ),
  name: z.string(),
  email: z.string(),
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: z.union([z.enum(CRM_STATUS_VALUES), z.literal("")]),
  crm_note: z.string(),
  data_source: z.union([z.enum(DATA_SOURCE_VALUES), z.literal("")]),
  possession_time: z.string(),
  description: z.string(),
});

const FIELD_ISSUE_MESSAGES: Record<string, string> = {
  crm_status:
    "The AI suggested a lead status that isn't one of our supported values, so this row was skipped rather than guess.",
  data_source:
    "The lead source didn't match any of our known sources, so this row was skipped for manual review.",
  created_at:
    "The lead's date couldn't be confidently understood, so this row was skipped instead of risking a wrong date.",
};

function describeSchemaIssue(field: string): string {
  if (FIELD_ISSUE_MESSAGES[field]) {
    return FIELD_ISSUE_MESSAGES[field];
  }
  if (!field) {
    return "This row's data didn't match the expected CRM format, so it was skipped to keep your data clean.";
  }
  return `The "${field}" field came back in an unexpected format, so this row was skipped to keep your data clean.`;
}

export type SchemaValidationResult =
  | { success: true; data: CrmRecord }
  | { success: false; reason: string };

export function validateSchema(record: unknown): SchemaValidationResult {
  const result = crmRecordSchema.safeParse(record);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue.path.join(".");
    return { success: false, reason: describeSchemaIssue(field) };
  }

  return { success: true, data: result.data as CrmRecord };
}

export type BusinessRuleResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateBusinessRules(record: CrmRecord): BusinessRuleResult {
  if (!record.email && !record.mobile_without_country_code) {
    return {
      valid: false,
      reason:
        "No email or phone number on this lead — without a way to reach them, it was left out of the import.",
    };
  }

  return { valid: true };
}
