/**
 * AI prompts for extracting firm details from various sources
 */

export const FIRM_EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting business contact information from various document formats.

Extract the following fields from the provided text and return ONLY a valid JSON object:

{
  "entity": "Business/company name",
  "abn": "Australian Business Number (11 digits only, no spaces or formatting)",
  "address": "Full business address",
  "contact": "Primary contact person full name",
  "email": "Business email address",
  "mobile": "Mobile phone number"
}

Important rules:
1. Return null for any fields not found in the source text
2. For ABN: Extract only the 11 digits, remove all spaces and formatting
3. For mobile: Format as Australian format (either +61 4XX XXX XXX or 04XX XXX XXX)
4. For entity: Extract the official business/company name
5. For contact: Extract the person's full name, not just first name
6. Return ONLY the JSON object, no additional text or explanation
7. If you cannot find any business information, return all fields as null

Example valid response:
{
  "entity": "ABC Consulting Pty Ltd",
  "abn": "12345678901",
  "address": "123 Business St, Sydney NSW 2000",
  "contact": "John Smith",
  "email": "john@abcconsulting.com.au",
  "mobile": "0412 345 678"
}`;

export const FIRM_EXTRACTION_USER_PROMPT = (content: string) =>
  `Extract business contact information from the following text:\n\n${content}`;

export interface ExtractedFirmData {
  entity: string | null;
  abn: string | null;
  address: string | null;
  contact: string | null;
  email: string | null;
  mobile: string | null;
}
