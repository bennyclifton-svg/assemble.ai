import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFromDocument, type ExtractionRequest, type ExtractionResult } from '../extractors';
import * as openaiModule from '../openai';

// Mock the OpenAI client
vi.mock('../openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

// Mock pdf-parse
const mockGetText = vi.fn();
const mockDestroy = vi.fn();
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    getText = mockGetText;
    destroy = mockDestroy;
  },
}));

// Mock fetch for PDF downloads
global.fetch = vi.fn();

describe('extractFromDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PDF text extraction (AC2)', () => {
    it('should extract text from digital PDF using pdf-parse', async () => {
      const mockPDFText = 'Sample PDF text content with sufficient length to bypass GPT-4 Vision threshold';

      // Mock fetch response
      (global.fetch as any).mockResolvedValueOnce({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      // Mock PDFParse getText method
      mockGetText.mockResolvedValueOnce({
        text: mockPDFText,
      });
      mockDestroy.mockResolvedValueOnce(undefined);

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/document.pdf',
        documentType: 'pdf',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(true);
      expect(result.extractedText).toBe(mockPDFText);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should fall back to GPT-4 Vision for scanned PDFs with minimal text', async () => {
      const shortText = 'abc'; // Less than 100 characters
      const mockVisionResponse = {
        extractedText: 'Scanned document content extracted by GPT-4 Vision',
        structuredData: { projectName: 'Test Project' },
      };

      // Mock fetch
      (global.fetch as any).mockResolvedValueOnce({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });

      // Mock PDFParse returning minimal text
      mockGetText.mockResolvedValueOnce({ text: shortText });
      mockDestroy.mockResolvedValueOnce(undefined);

      // Mock GPT-4 Vision API
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(mockVisionResponse),
          },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/scanned.pdf',
        documentType: 'pdf',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(true);
      expect(result.extractedText).toBe(mockVisionResponse.extractedText);
      expect(result.structuredData).toEqual(mockVisionResponse.structuredData);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-vision-preview',
        })
      );
    });
  });

  describe('GPT-4 Vision OCR (AC1, AC3)', () => {
    it('should extract text from images using GPT-4 Vision API', async () => {
      const mockVisionResponse = {
        extractedText: 'Text extracted from image',
        structuredData: { address: '123 Main St' },
      };

      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(mockVisionResponse),
          },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/image.jpg',
        documentType: 'image',
        context: 'details',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(true);
      expect(result.extractedText).toBe(mockVisionResponse.extractedText);
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate.mock.calls[0][0]).toMatchObject({
        model: 'gpt-4-vision-preview',
        max_tokens: 4096,
        temperature: 0.3,
      });
    });

    it('should handle GPT-4 Vision API errors gracefully', async () => {
      const mockCreate = vi.fn().mockRejectedValueOnce(new Error('API Error'));
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/image.jpg',
        documentType: 'image',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(false);
      expect(result.extractedText).toBe('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Context-aware prompt building', () => {
    it('should build prompts for details context', async () => {
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: JSON.stringify({ extractedText: 'test', structuredData: {} }) },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
        context: 'details',
        targetFields: ['projectName', 'address'],
      };

      await extractFromDocument(request);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      const promptText = userMessage.content[0].text;

      expect(promptText).toContain('project details');
      expect(promptText).toContain('projectName, address');
      expect(promptText).toContain('JSON');
    });

    it('should build prompts for objectives context', async () => {
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: JSON.stringify({ extractedText: 'test', structuredData: {} }) },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
        context: 'objectives',
      };

      await extractFromDocument(request);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      const promptText = userMessage.content[0].text;

      expect(promptText).toContain('objectives');
    });
  });

  describe('Confidence calculation', () => {
    it('should calculate confidence based on populated fields', async () => {
      const mockVisionResponse = {
        extractedText: 'test',
        structuredData: {
          projectName: 'Test',
          address: '123 Main',
          zoning: '', // Empty field
          jurisdiction: null, // Null field
        },
      };

      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: JSON.stringify(mockVisionResponse) },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
      };

      const result = await extractFromDocument(request);

      // 2 populated out of 4 fields = 0.5 confidence
      expect(result.confidence).toBe(0.5);
    });

    it('should return 0 confidence for empty structured data', async () => {
      const mockVisionResponse = {
        extractedText: 'test',
        structuredData: {},
      };

      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: JSON.stringify(mockVisionResponse) },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
      };

      const result = await extractFromDocument(request);

      expect(result.confidence).toBe(0);
    });
  });

  describe('Processing time tracking (AC4)', () => {
    it('should track processing time for all extractions', async () => {
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: JSON.stringify({ extractedText: 'test', structuredData: {} }) },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
      };

      const result = await extractFromDocument(request);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('Error handling (AC6)', () => {
    it('should return error result on extraction failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.pdf',
        documentType: 'pdf',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(false);
      expect(result.extractedText).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle non-JSON responses from GPT-4 Vision gracefully', async () => {
      const mockCreate = vi.fn().mockResolvedValueOnce({
        choices: [{
          message: { content: 'Not valid JSON' },
        }],
      });
      (openaiModule.openai.chat.completions.create as any) = mockCreate;

      const request: ExtractionRequest = {
        documentUrl: 'https://example.com/doc.jpg',
        documentType: 'image',
      };

      const result = await extractFromDocument(request);

      expect(result.success).toBe(true);
      expect(result.extractedText).toBe('Not valid JSON');
      expect(result.structuredData).toEqual({});
    });
  });
});
