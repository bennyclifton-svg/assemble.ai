import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Default model for firm extraction
 * Using gpt-4o-mini - fast, cheap, and good for structured data extraction
 */
export const FIRM_EXTRACTION_MODEL = 'gpt-4o-mini';

/**
 * Model for tender package generation
 * Using gpt-4-turbo for speed and quality (Story 4.2, AC #5: < 30s generation)
 */
export const TENDER_GENERATION_MODEL = 'gpt-4-turbo';

/**
 * Timeout for AI extraction (5 seconds per NFR requirement)
 */
export const AI_EXTRACTION_TIMEOUT = 5000;

/**
 * Timeout for tender generation (25 seconds to leave buffer for DB operations)
 * Story 4.2, AC #5: Total generation must be < 30 seconds
 */
export const TENDER_GENERATION_TIMEOUT = 25000;
