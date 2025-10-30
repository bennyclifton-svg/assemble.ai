/**
 * AI prompts for generating scope and deliverables based on discipline/trade
 */

export interface ProjectContext {
  projectName?: string;
  address?: string;
  zoning?: string;
  objectives?: string;
  staging?: string;
  discipline?: string;
  trade?: string;
  existingScope?: string;
  existingDeliverables?: string;
  documentContent?: string;
}

export const SCOPE_GENERATION_SYSTEM_PROMPT = `You are an expert construction project consultant specializing in creating detailed scope of work documents for various disciplines and trades.

Your task is to generate a comprehensive, discipline-specific scope of work based on the provided project context.

Guidelines:
1. Generate realistic, detailed scope items appropriate for the discipline/trade
2. Consider project type, location, zoning, and objectives
3. Include typical phases: concept, design development, documentation, tender support, construction phase services
4. Use professional language and industry-standard terminology
5. Include 5-10 key scope items, each as a separate bullet point
6. If existing scope is provided, enhance or refine it rather than replacing it
7. If document content is provided, extract relevant requirements and incorporate them
8. Return ONLY the scope items as a markdown list, no additional commentary

Format your response as a markdown list:
- Item 1
- Item 2
- Item 3`;

export const DELIVERABLES_GENERATION_SYSTEM_PROMPT = `You are an expert construction project consultant specializing in defining deliverables for various disciplines and trades.

Your task is to generate a comprehensive, discipline-specific list of deliverables based on the provided project context.

Guidelines:
1. Generate realistic, detailed deliverable items appropriate for the discipline/trade
2. Include typical deliverable types: drawings, reports, specifications, certifications, etc.
3. Consider project phases and what deliverables are needed at each stage
4. Use professional language and industry-standard terminology
5. Include 5-15 key deliverable items, each as a separate bullet point
6. If existing deliverables are provided, enhance or refine them rather than replacing them
7. If document content is provided, extract relevant requirements and incorporate them
8. Return ONLY the deliverable items as a markdown list, no additional commentary

Format your response as a markdown list:
- Deliverable 1
- Deliverable 2
- Deliverable 3`;

export function buildScopePrompt(context: ProjectContext): string {
  const parts: string[] = [];

  parts.push('Generate a comprehensive scope of work for the following project:');
  parts.push('');

  if (context.projectName) {
    parts.push(`Project: ${context.projectName}`);
  }

  if (context.address) {
    parts.push(`Location: ${context.address}`);
  }

  if (context.zoning) {
    parts.push(`Zoning: ${context.zoning}`);
  }

  if (context.discipline) {
    parts.push(`Discipline: ${context.discipline}`);
  }

  if (context.trade) {
    parts.push(`Trade: ${context.trade}`);
  }

  if (context.objectives) {
    parts.push('');
    parts.push('Project Objectives:');
    parts.push(context.objectives);
  }

  if (context.staging) {
    parts.push('');
    parts.push('Project Staging:');
    parts.push(context.staging);
  }

  if (context.existingScope) {
    parts.push('');
    parts.push('Existing Scope (enhance/refine this):');
    parts.push(context.existingScope);
  }

  if (context.documentContent) {
    parts.push('');
    parts.push('Additional Context from Documents:');
    parts.push(context.documentContent);
  }

  parts.push('');
  parts.push('Generate a detailed, professional scope of work as a markdown list.');

  return parts.join('\n');
}

export function buildDeliverablesPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  parts.push('Generate a comprehensive list of deliverables for the following project:');
  parts.push('');

  if (context.projectName) {
    parts.push(`Project: ${context.projectName}`);
  }

  if (context.address) {
    parts.push(`Location: ${context.address}`);
  }

  if (context.zoning) {
    parts.push(`Zoning: ${context.zoning}`);
  }

  if (context.discipline) {
    parts.push(`Discipline: ${context.discipline}`);
  }

  if (context.trade) {
    parts.push(`Trade: ${context.trade}`);
  }

  if (context.objectives) {
    parts.push('');
    parts.push('Project Objectives:');
    parts.push(context.objectives);
  }

  if (context.staging) {
    parts.push('');
    parts.push('Project Staging:');
    parts.push(context.staging);
  }

  if (context.existingDeliverables) {
    parts.push('');
    parts.push('Existing Deliverables (enhance/refine this):');
    parts.push(context.existingDeliverables);
  }

  if (context.documentContent) {
    parts.push('');
    parts.push('Additional Context from Documents:');
    parts.push(context.documentContent);
  }

  parts.push('');
  parts.push('Generate a detailed, professional list of deliverables as a markdown list.');

  return parts.join('\n');
}

export const OBJECTIVES_GENERATION_SYSTEM_PROMPT = `You are an expert construction project consultant specializing in defining project objectives.

Your task is to generate comprehensive, professional project objectives based on the provided project context.

Guidelines:
1. Generate 4 distinct objectives covering: Functional, Quality, Budget, and Program/Schedule
2. Each objective should be clear, measurable, and actionable
3. Consider project type, location, zoning, and any existing context
4. Use professional language appropriate for tender documentation
5. Each objective should be 2-4 sentences
6. If existing objectives are provided, enhance or refine them rather than replacing them
7. If document content is provided, extract relevant requirements and incorporate them
8. Return ONLY the objectives content, no additional commentary

Format your response as follows:
Functional: [2-4 sentences about functional requirements and performance criteria]

Quality: [2-4 sentences about quality standards, compliance, and certifications]

Budget: [2-4 sentences about budget constraints, value engineering, and cost management]

Program: [2-4 sentences about timeline, milestones, and scheduling requirements]`;

export function buildObjectivesPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  parts.push('Generate comprehensive project objectives for the following project:');
  parts.push('');

  if (context.projectName) {
    parts.push(`Project: ${context.projectName}`);
  }

  if (context.address) {
    parts.push(`Location: ${context.address}`);
  }

  if (context.zoning) {
    parts.push(`Zoning: ${context.zoning}`);
  }

  if (context.objectives) {
    parts.push('');
    parts.push('Existing Objectives (enhance/refine these):');
    parts.push(context.objectives);
  }

  if (context.staging) {
    parts.push('');
    parts.push('Project Staging:');
    parts.push(context.staging);
  }

  if (context.documentContent) {
    parts.push('');
    parts.push('Additional Context from Documents:');
    parts.push(context.documentContent);
  }

  parts.push('');
  parts.push('Generate detailed, professional project objectives covering Functional, Quality, Budget, and Program aspects.');

  return parts.join('\n');
}

export const RISK_GENERATION_SYSTEM_PROMPT = `You are an expert construction project consultant specializing in risk management and assessment.

Your task is to generate comprehensive, professional risk assessments based on the provided project context.

Guidelines:
1. Generate 4 distinct risk categories covering: Design, Construction, Financial, and Schedule risks
2. Each risk section should identify 3-5 key risks and mitigation strategies
3. Consider project type, location, zoning, complexity, and any existing context
4. Use professional language appropriate for risk registers and tender documentation
5. Each risk category should be 3-5 sentences
6. If existing risks are provided, enhance or refine them rather than replacing them
7. If document content is provided, extract relevant risks and incorporate them
8. Return ONLY the risk assessments, no additional commentary

Format your response as follows:
Design: [3-5 sentences describing design-related risks including unknown site conditions, design complexity, approvals, coordination, etc.]

Construction: [3-5 sentences describing construction-related risks including methodology, materials, labor, safety, quality, etc.]

Financial: [3-5 sentences describing financial risks including budget constraints, market conditions, contingencies, variations, etc.]

Schedule: [3-5 sentences describing schedule risks including timeline constraints, dependencies, approvals, weather, procurement, etc.]`;

export function buildRiskPrompt(context: ProjectContext): string {
  const parts: string[] = [];

  parts.push('Generate comprehensive risk assessments for the following project:');
  parts.push('');

  if (context.projectName) {
    parts.push(`Project: ${context.projectName}`);
  }

  if (context.address) {
    parts.push(`Location: ${context.address}`);
  }

  if (context.zoning) {
    parts.push(`Zoning: ${context.zoning}`);
  }

  if (context.objectives) {
    parts.push('');
    parts.push('Project Objectives:');
    parts.push(context.objectives);
  }

  if (context.staging) {
    parts.push('');
    parts.push('Project Staging:');
    parts.push(context.staging);
  }

  if (context.documentContent) {
    parts.push('');
    parts.push('Additional Context from Documents:');
    parts.push(context.documentContent);
  }

  parts.push('');
  parts.push('Generate detailed, professional risk assessments covering Design, Construction, Financial, and Schedule aspects.');

  return parts.join('\n');
}
