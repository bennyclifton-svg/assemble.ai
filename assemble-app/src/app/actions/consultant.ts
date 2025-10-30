'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { openai, FIRM_EXTRACTION_MODEL } from '@/lib/ai/openai';
import {
  FIRM_EXTRACTION_SYSTEM_PROMPT,
  FIRM_EXTRACTION_USER_PROMPT,
  type ExtractedFirmData,
} from '@/lib/ai/firmExtractorPrompts';
import {
  SCOPE_GENERATION_SYSTEM_PROMPT,
  DELIVERABLES_GENERATION_SYSTEM_PROMPT,
  buildScopePrompt,
  buildDeliverablesPrompt,
  type ProjectContext,
} from '@/lib/ai/scopeGeneratorPrompts';
import { parseVCard, isVCard } from '@/lib/parsers/vcardParser';
import { parseEmail, extractEmailText, isEmail } from '@/lib/parsers/emailParser';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Extract firm details from text content using AI
 */
export async function extractFirmDetailsFromText(
  content: string
): Promise<ActionResult<ExtractedFirmData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if content is a vCard
    if (isVCard(content)) {
      const vcardData = parseVCard(content);
      return {
        success: true,
        data: {
          entity: vcardData.entity || null,
          abn: vcardData.abn || null,
          address: vcardData.address || null,
          contact: vcardData.contact || null,
          email: vcardData.email || null,
          mobile: vcardData.mobile || null,
        },
      };
    }

    // Check if content is an email
    if (isEmail(content)) {
      const emailData = parseEmail(content);
      content = extractEmailText(emailData);
    }

    // Use AI to extract from plain text
    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: 'system',
          content: FIRM_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: FIRM_EXTRACTION_USER_PROMPT(content),
        },
      ],
      temperature: 0, // Deterministic output
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return {
        success: false,
        error: { message: 'No response from AI', code: 'AI_NO_RESPONSE' },
      };
    }

    // Parse JSON response
    try {
      const extracted = JSON.parse(responseText) as ExtractedFirmData;

      return {
        success: true,
        data: extracted,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return {
        success: false,
        error: { message: 'Failed to parse AI response', code: 'AI_PARSE_ERROR' },
      };
    }
  } catch (error) {
    console.error('Error extracting firm details:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to extract firm details',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Extract firm details from a file
 */
export async function extractFirmDetailsFromFile(
  fileContent: string,
  fileName: string
): Promise<ActionResult<ExtractedFirmData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Determine file type and extract accordingly
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      case 'vcf':
        // vCard file
        const vcardData = parseVCard(fileContent);
        return {
          success: true,
          data: {
            entity: vcardData.entity || null,
            abn: vcardData.abn || null,
            address: vcardData.address || null,
            contact: vcardData.contact || null,
            email: vcardData.email || null,
            mobile: vcardData.mobile || null,
          },
        };

      case 'eml':
      case 'msg':
        // Email file
        const emailData = parseEmail(fileContent);
        const emailText = extractEmailText(emailData);
        return extractFirmDetailsFromText(emailText);

      case 'txt':
      case 'pdf':
      case 'docx':
      default:
        // Plain text or document - use AI extraction
        return extractFirmDetailsFromText(fileContent);
    }
  } catch (error) {
    console.error('Error extracting firm details from file:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to extract firm details from file',
        code: 'SERVER_ERROR',
      },
    };
  }
}


/**
 * Generate scope of work using AI
 */
export async function generateScopeAction(
  context: ProjectContext
): Promise<ActionResult<string>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      };
    }

    const userPrompt = buildScopePrompt(context);

    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: "system",
          content: SCOPE_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedScope = completion.choices[0]?.message?.content;

    if (!generatedScope) {
      return {
        success: false,
        error: { message: "No response from AI", code: "AI_NO_RESPONSE" },
      };
    }

    return {
      success: true,
      data: generatedScope.trim(),
    };
  } catch (error) {
    console.error("Error generating scope:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to generate scope",
        code: "SERVER_ERROR",
      },
    };
  }
}

/**
 * Generate deliverables using AI
 */
export async function generateDeliverablesAction(
  context: ProjectContext
): Promise<ActionResult<string>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      };
    }

    const userPrompt = buildDeliverablesPrompt(context);

    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: "system",
          content: DELIVERABLES_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedDeliverables = completion.choices[0]?.message?.content;

    if (!generatedDeliverables) {
      return {
        success: false,
        error: { message: "No response from AI", code: "AI_NO_RESPONSE" },
      };
    }

    return {
      success: true,
      data: generatedDeliverables.trim(),
    };
  } catch (error) {
    console.error("Error generating deliverables:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to generate deliverables",
        code: "SERVER_ERROR",
      },
    };
  }
}

/**
 * Get discipline data (scope and deliverables) for a specific discipline
 */
export async function getDisciplineData(
  projectId: string,
  disciplineId: string
): Promise<ActionResult<{ scope: string | null; deliverables: string | null }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const data = await prisma.disciplineData.findUnique({
      where: {
        projectId_disciplineId: {
          projectId,
          disciplineId,
        },
      },
      select: {
        scope: true,
        deliverables: true,
      },
    });

    return {
      success: true,
      data: {
        scope: data?.scope || null,
        deliverables: data?.deliverables || null,
      },
    };
  } catch (error) {
    console.error('Error fetching discipline data:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch discipline data',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Update scope for a specific discipline
 */
export async function updateScopeAction(
  projectId: string,
  disciplineId: string,
  scope: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.disciplineData.upsert({
      where: {
        projectId_disciplineId: {
          projectId,
          disciplineId,
        },
      },
      create: {
        projectId,
        disciplineId,
        scope,
        createdBy: userId,
        updatedBy: userId,
      },
      update: {
        scope,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error updating scope:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update scope',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Update deliverables for a specific discipline
 */
export async function updateDeliverablesAction(
  projectId: string,
  disciplineId: string,
  deliverables: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.disciplineData.upsert({
      where: {
        projectId_disciplineId: {
          projectId,
          disciplineId,
        },
      },
      create: {
        projectId,
        disciplineId,
        deliverables,
        createdBy: userId,
        updatedBy: userId,
      },
      update: {
        deliverables,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error updating deliverables:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update deliverables',
        code: 'SERVER_ERROR',
      },
    };
  }
}

