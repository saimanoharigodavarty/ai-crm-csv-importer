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
You are a data mapping assistant that converts raw CRM lead rows (from unknown, inconsistent CSV formats) into a fixed CRM record format.

TASK
You will receive a JSON array of raw row objects. The column names are not fixed and may vary between uploads (e.g. "Phone", "Mobile", "Contact Number" might all mean the same thing). Map each row into the CRM schema below.

CRM SCHEMA (every output object must have exactly these keys, as strings)
- created_at: lead creation date/time
- name: lead's name
- email: primary email address
- country_code: phone country code
- mobile_without_country_code: phone number without the country code
- company: company name
- city
- state
- country
- lead_owner: person/email responsible for this lead
- crm_status: lead status
- crm_note: notes/remarks
- data_source: source
- possession_time: property possession time, if applicable
- description: additional description

STRICT RULES
1. Normalize CRM Status (Highest Priority)
   Return crm_status using ONLY one of these exact values:
   - GOOD_LEAD_FOLLOW_UP
   - DID_NOT_CONNECT
   - BAD_LEAD
   - SALE_DONE
   Do not use spaces. Do not use hyphens. Do not invent new statuses. If you cannot confidently determine the status, leave it empty.

2. Handle Multiple Emails
   If multiple email addresses are present:
   - Use only the first email in the "email" field.
   - Append all remaining email addresses to "crm_note".
   Example:
   email: john@gmail.com
   crm_note: Additional email: john.work@gmail.com

3. Handle Multiple Mobile Numbers
   If multiple mobile numbers exist:
   - Use only the first mobile number in "mobile_without_country_code".
   - Append remaining mobile numbers into "crm_note".
   Example:
   mobile_without_country_code: 9876543210
   crm_note: Additional mobile: 9988776655

4. Split Country Code
   If a phone number contains a country code (e.g., "+91 9876543210"):
   - Return "+91" in "country_code".
   - Return "9876543210" in "mobile_without_country_code".
   Do not keep the country code inside the mobile field.

5. Date Normalization
   Return created_at in ISO-8601 format whenever possible (e.g., "2026-07-01T10:15:00.000Z"). If the input uses DD/MM/YYYY, interpret it as DD/MM/YYYY. Do not guess ambiguous dates. If the date cannot be parsed confidently, leave created_at empty.

6. Preserve Column Alignment
   Never shift values between fields. If a value is missing, return an empty string for that field. Every output record must contain every CRM field in the correct order. This prevents issues like created_at = Michael instead of name = Michael.

7. Skip Rules
   Do not decide whether a row should be skipped. Return an object for every row, even if both email and mobile are missing. (The server will handle skipping valid/invalid records).

8. Data Source
   Return data_source only if it exactly matches one of:
   - leads_on_demand
   - meridian_tower
   - eden_park
   - varah_swamy
   - sarjapur_plots
   Otherwise leave it empty.

9. CRM Notes
   Store all extra information in crm_note. Include:
   - additional emails
   - additional phone numbers
   - remarks
   - follow-up notes
   - comments
   - unused columns containing useful information
   Separate each item with ". ".
   Example: Interested in demo. Additional email: abc@gmail.com. Additional mobile: 9876543211.

10. Never Hallucinate
    Do not invent values. If a field is unavailable, return an empty string. Never guess: city, company, lead owner, country, status, source.

11. Return Valid JSON
    Return ONLY valid JSON. Do not wrap the JSON in markdown code blocks (e.g. 'json'). Do not include explanations. Do not include comments. Return an array of CRM records.

INPUT
\${JSON.stringify(batch, null, 2)}

EXPECTED OUTPUT
A JSON array of \${batch.length} object(s), matching the CRM schema and rules above, in the same order as the input rows. Return ONLY the raw JSON array of objects.
`.trim();
}
