import type { RawRow } from "../types/crm";

const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

export function buildCrmExtractionPrompt(batch: RawRow[]): string {
  return `
ROLE
You are a data mapping assistant that converts raw CRM lead rows (from
unknown, inconsistent CSV formats) into a fixed CRM record format.

TASK
You will receive a JSON array of raw row objects. The column names are not
fixed and may vary between uploads (e.g. "Phone", "Mobile", "Contact Number"
might all mean the same thing). Map each row into the CRM schema below.

CRM SCHEMA (every output object must have exactly these keys, as strings)
- created_at: lead creation date/time
- name: lead's name
- email: primary email address
- country_code: phone country code (e.g. "+91")
- mobile_without_country_code: phone number without the country code
- company: company name
- city
- state
- country
- lead_owner: person/email responsible for this lead
- crm_status: one of ${JSON.stringify(CRM_STATUS_VALUES)}, or "" if unclear
- crm_note: remarks, follow-up notes, extra emails/phones, anything useful
  that doesn't fit another field
- data_source: one of ${JSON.stringify(DATA_SOURCE_VALUES)}, or "" if none
  match confidently
- possession_time: property possession time, if applicable
- description: additional description

RULES
1. Return exactly one CRM object for every input row, in the same order.
   If information for a field is unavailable, leave it as an empty string
   rather than inventing a value.
2. created_at must be a value that JavaScript's new Date(value) can parse
   correctly (prefer ISO 8601 format), or an empty string if no date exists.
3. If a row has multiple email addresses, use the first as "email" and
   append the rest into "crm_note".
4. If a row has multiple phone numbers, use the first as
   "mobile_without_country_code" and append the rest into "crm_note".
5. Only use a crm_status or data_source value from the allowed lists above.
   Never invent a new value.
6. Do not decide whether a row should be skipped. Always return an object
   for every row, even if most fields end up empty.

INPUT
${JSON.stringify(batch, null, 2)}

EXPECTED OUTPUT
A JSON array of ${batch.length} object(s), matching the CRM schema above,
in the same order as the input rows. Return only the JSON array, no other
text.
`.trim();
}
