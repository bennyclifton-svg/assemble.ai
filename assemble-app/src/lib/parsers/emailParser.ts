/**
 * Email message parser for extracting firm/contact details from email headers and body
 */

export interface EmailData {
  from?: string;
  subject?: string;
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Parse email message (.eml format)
 */
export function parseEmail(emailText: string): EmailData {
  const result: EmailData = {
    headers: {},
  };

  // Split into headers and body
  const parts = emailText.split(/\r?\n\r?\n/);
  const headerSection = parts[0];
  const bodySection = parts.slice(1).join('\n\n');

  // Parse headers
  const headerLines = headerSection.split(/\r?\n/);
  let currentHeader = '';
  let currentValue = '';

  for (const line of headerLines) {
    if (line.match(/^[\w-]+:/)) {
      // New header
      if (currentHeader) {
        result.headers![currentHeader.toLowerCase()] = currentValue.trim();
      }
      const [header, ...value] = line.split(':');
      currentHeader = header.trim();
      currentValue = value.join(':').trim();
    } else if (line.startsWith(' ') || line.startsWith('\t')) {
      // Continuation of previous header
      currentValue += ' ' + line.trim();
    }
  }

  // Save last header
  if (currentHeader) {
    result.headers![currentHeader.toLowerCase()] = currentValue.trim();
  }

  // Extract common fields
  result.from = result.headers!['from'];
  result.subject = result.headers!['subject'];
  result.body = bodySection.trim();

  return result;
}

/**
 * Extract text content from email (removing HTML if present)
 */
export function extractEmailText(emailData: EmailData): string {
  let text = '';

  // Add subject
  if (emailData.subject) {
    text += `Subject: ${emailData.subject}\n\n`;
  }

  // Add from
  if (emailData.from) {
    text += `From: ${emailData.from}\n\n`;
  }

  // Add body (strip HTML if present)
  if (emailData.body) {
    // Simple HTML stripping (for more complex cases, we'd use a proper HTML parser)
    const stripped = emailData.body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    text += stripped;
  }

  return text;
}

/**
 * Check if content is an email message
 */
export function isEmail(content: string): boolean {
  // Check for common email headers
  return (
    content.includes('From:') ||
    content.includes('Subject:') ||
    content.includes('Date:') ||
    content.includes('To:')
  ) && (
    content.includes('@') // Has email addresses
  );
}
