/**
 * AI prompts for extracting project details from various sources
 */

export const PROJECT_DETAILS_EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting project information from construction and real estate documents.

Extract the following fields from the provided text and return ONLY a valid JSON object:

{
  "projectName": "Name of the project or building",
  "address": "Physical street address of the project site",
  "legalAddress": "Legal address or lot/parcel description",
  "zoning": "Zoning classification (e.g., R1, B4, etc.)",
  "jurisdiction": "Local government area or jurisdiction",
  "lotArea": "Lot area with unit (e.g., '500 sqm', '0.5 ha')",
  "numberOfStories": "Number of stories/levels (as a number string, e.g., '3', '12')",
  "buildingClass": "Building classification (e.g., 'Class 2', 'Class 5', etc.)"
}

Important rules:
1. Return null for any fields not found in the source text
2. For projectName: Extract the official project or building name
3. For address: Extract the physical street address where construction will occur
4. For legalAddress: Extract legal description, lot/DP numbers if available
5. For zoning: Extract zoning code (e.g., R1, R2, B4, IN1, etc.)
6. For jurisdiction: Extract council name or local government area
7. For lotArea: Include the unit (sqm, ha, acres, etc.)
8. For numberOfStories: Extract just the number as a string
9. For buildingClass: Extract BCA building class if mentioned
10. Return ONLY the JSON object, no additional text or explanation
11. If you cannot find any project information, return all fields as null

Example valid response:
{
  "projectName": "Green Valley Apartments",
  "address": "42-48 Smith Street, Parramatta NSW 2150",
  "legalAddress": "Lot 10 DP 123456",
  "zoning": "R4",
  "jurisdiction": "City of Parramatta",
  "lotArea": "2,450 sqm",
  "numberOfStories": "8",
  "buildingClass": "Class 2"
}`;

export const PROJECT_DETAILS_EXTRACTION_USER_PROMPT = (content: string) =>
  `Extract project information from the following text:\n\n${content}`;

export interface ExtractedProjectDetailsData {
  projectName: string | null;
  address: string | null;
  legalAddress: string | null;
  zoning: string | null;
  jurisdiction: string | null;
  lotArea: string | null;
  numberOfStories: string | null;
  buildingClass: string | null;
}
