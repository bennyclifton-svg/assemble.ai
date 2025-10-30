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
 * Timeout for AI extraction (5 seconds per NFR requirement)
 */
export const AI_EXTRACTION_TIMEOUT = 5000;
