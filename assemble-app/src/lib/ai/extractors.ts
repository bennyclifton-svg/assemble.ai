import { openai } from './openai';
import { PDFParse } from 'pdf-parse';

/**
 * AI Document Extraction Service
 * Extracts text and structured data from documents using PDF parsing and GPT-4 Vision
 */

export interface ExtractionRequest {
  documentUrl: string;
  documentType: 'pdf' | 'image' | 'scanned';
  targetFields?: string[];
  context?: 'details' | 'objectives' | 'staging' | 'risk' | 'stakeholders' |
            'scope' | 'deliverables' | 'fee_structure';
}

export interface ExtractionResult {
  success: boolean;
  extractedText: string;
  structuredData?: {
    projectName?: string;
    address?: string;
    zoning?: string;
    objectives?: string[];
    stages?: Array<{ name: string; date?: string }>;
    risks?: string[];
    stakeholders?: Array<{
      role: string;
      organization: string;
      name: string;
      email: string;
      mobile: string;
    }>;
    scopeItems?: string[];
    deliverables?: string[];
    feeStructure?: Array<{ stage: string; amount: number }>;
    [key: string]: any;
  };
  confidence: number;
  processingTime: number;
}

/**
 * Main extraction function - routes to appropriate extraction method
 */
export async function extractFromDocument(
  request: ExtractionRequest
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    let extractedText = '';
    let structuredData = {};

    if (request.documentType === 'pdf') {
      // Try pdf-parse first for digital PDFs
      extractedText = await extractFromPDF(request.documentUrl);

      // If minimal text extracted, use GPT-4 Vision for scanned PDFs
      if (extractedText.length < 100) {
        const visionResult = await extractWithGPT4Vision(request);
        extractedText = visionResult.text;
        structuredData = visionResult.structured;
      } else {
        // Parse structured data from extracted text if context provided
        if (request.context) {
          structuredData = await parseStructuredData(extractedText, request.context);
        }
      }
    } else {
      // Use GPT-4 Vision for images and scanned documents
      const visionResult = await extractWithGPT4Vision(request);
      extractedText = visionResult.text;
      structuredData = visionResult.structured;
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      extractedText,
      structuredData,
      confidence: calculateConfidence(structuredData),
      processingTime,
    };
  } catch (error) {
    console.error('Document extraction failed', { error, request });
    return {
      success: false,
      extractedText: '',
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Extract text from PDF using pdf-parse library
 */
async function extractFromPDF(url: string): Promise<string> {
  try {
    // Download PDF from URL
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Extract text using PDFParse class
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    const textResult = await parser.getText();
    await parser.destroy(); // Clean up resources

    return textResult.text || '';
  } catch (error) {
    console.error('PDF parsing failed:', error);
    return ''; // Return empty string to trigger GPT-4 Vision fallback
  }
}

/**
 * Extract text and structured data using GPT-4 Vision API
 */
async function extractWithGPT4Vision(
  request: ExtractionRequest
): Promise<{ text: string; structured: any }> {
  const prompt = buildExtractionPrompt(request.context, request.targetFields);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a construction document expert. Extract text and structured data from documents.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: request.documentUrl } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  if (!response || !response.choices || !response.choices[0]) {
    throw new Error('Invalid response from GPT-4 Vision API');
  }

  const content = response.choices[0].message.content;

  // Parse JSON response for structured data
  try {
    const parsed = JSON.parse(content || '{}');
    return {
      text: parsed.extractedText || '',
      structured: parsed.structuredData || {},
    };
  } catch {
    // Fallback if response isn't valid JSON
    return {
      text: content || '',
      structured: {},
    };
  }
}

/**
 * Build context-aware extraction prompt
 */
function buildExtractionPrompt(
  context?: string,
  targetFields?: string[]
): string {
  const basePrompt = `Extract all text from this document. `;

  const contextPrompts: Record<string, string> = {
    details: `Focus on project details like name, address, zoning, jurisdiction, lot area, building class.`,
    objectives: `Extract functional, quality, budget, and program objectives.`,
    staging: `Identify project stages with names and dates.`,
    risk: `Extract risk items with descriptions and mitigation strategies.`,
    stakeholders: `Extract stakeholder information including role, organization, name, email, and mobile.`,
    scope: `Extract scope of work items as a list.`,
    deliverables: `Extract deliverable items as a list.`,
    fee_structure: `Extract fee structure with stages and amounts.`,
  };

  let prompt = basePrompt;
  if (context && contextPrompts[context]) {
    prompt += contextPrompts[context];
  }

  if (targetFields && targetFields.length > 0) {
    prompt += ` Specifically extract: ${targetFields.join(', ')}.`;
  }

  prompt += ` Return response as JSON with 'extractedText' and 'structuredData' fields.`;

  return prompt;
}

/**
 * Parse structured data from extracted text using AI
 */
async function parseStructuredData(
  text: string,
  context?: string
): Promise<any> {
  if (!context) return {};

  const prompt = `Extract structured data from this text. ${buildExtractionPrompt(context)}

Text:
${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a construction document expert. Extract structured data and return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');
    return parsed.structuredData || {};
  } catch (error) {
    console.error('Failed to parse structured data:', error);
    return {};
  }
}

/**
 * Calculate confidence score based on populated fields
 */
function calculateConfidence(structuredData: any): number {
  if (!structuredData || typeof structuredData !== 'object') return 0;

  const totalFields = Object.keys(structuredData).length;
  const populatedFields = Object.values(structuredData)
    .filter(value => value !== null && value !== undefined && value !== '')
    .length;

  return totalFields > 0 ? (populatedFields / totalFields) : 0;
}
