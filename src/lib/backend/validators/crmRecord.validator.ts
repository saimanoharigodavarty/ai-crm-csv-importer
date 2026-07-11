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

export type SchemaValidationResult =
  | { success: true; data: CrmRecord }
  | { success: false; reason: string };

export function validateSchema(record: unknown): SchemaValidationResult {
  const result = crmRecordSchema.safeParse(record);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const reason = `schema: ${firstIssue.path.join(".")} - ${firstIssue.message}`;
    return { success: false, reason };
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
      reason: "business rule: missing both email and mobile number",
    };
  }

  return { valid: true };
}
