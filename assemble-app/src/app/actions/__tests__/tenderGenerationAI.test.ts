/**
 * Tests for AI-powered tender generation server action
 * Story 4.2: AI Tender Package Generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTenderPackageWithAI } from '../tender';
import * as tenderGeneratorModule from '@/server/services/tenderGenerator';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-1' })),
}));

// Mock tender generator service
vi.mock('@/server/services/tenderGenerator', () => ({
  generateTenderPackage: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('generateTenderPackageWithAI Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate tender package successfully', async () => {
    const mockResult = {
      tenderPackageId: 'tender-1',
      generatedContent: {
        introduction: 'Test introduction',
        projectOverview: 'Test overview',
        scopeOfWork: 'Test scope',
        deliverables: 'Test deliverables',
        timeline: 'Test timeline',
        submissionRequirements: 'Test submission',
        sections: [],
      },
      documentSchedule: [],
      generationTimeMs: 15000,
      aiModel: 'gpt-4-turbo',
    };

    vi.mocked(tenderGeneratorModule.generateTenderPackage).mockResolvedValue(mockResult);

    const result = await generateTenderPackageWithAI({
      configId: 'config-1',
      firmId: 'firm-1',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.tenderPackageId).toBe('tender-1');
    expect(result.data?.generationTimeMs).toBe(15000);
    expect(result.data?.aiModel).toBe('gpt-4-turbo');
  });

  it('should return error if user is not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    vi.mocked(auth).mockReturnValueOnce({ userId: null } as any);

    const result = await generateTenderPackageWithAI({
      configId: 'config-1',
      firmId: 'firm-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should validate required parameters', async () => {
    const result = await generateTenderPackageWithAI({
      configId: '',
      firmId: 'firm-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameters');
  });

  it('should handle generation errors gracefully', async () => {
    vi.mocked(tenderGeneratorModule.generateTenderPackage).mockRejectedValue(
      new Error('Generation failed')
    );

    const result = await generateTenderPackageWithAI({
      configId: 'config-1',
      firmId: 'firm-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Generation failed');
  });
});
