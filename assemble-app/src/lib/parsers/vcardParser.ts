/**
 * vCard (VCF) parser for extracting firm/contact details
 * Supports vCard 3.0 and 4.0 formats
 */

export interface VCardData {
  entity?: string;
  contact?: string;
  email?: string;
  mobile?: string;
  address?: string;
  abn?: string;
}

/**
 * Parse vCard text content and extract relevant fields
 */
export function parseVCard(vcardText: string): VCardData {
  const result: VCardData = {};

  // Split into lines and process each
  const lines = vcardText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Handle line continuations (lines starting with space or tab)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      line += lines[i + 1].trim();
      i++;
    }

    // Parse the line
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const [fieldPart, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    // Get field name (before semicolon or equals sign)
    const fieldName = fieldPart.split(';')[0].split('=')[0].toUpperCase();

    switch (fieldName) {
      case 'ORG':
        // Organization/Company name
        result.entity = value.split(';')[0];
        break;

      case 'FN':
        // Full name (contact person)
        if (!result.contact) {
          result.contact = value;
        }
        break;

      case 'N':
        // Structured name: Last;First;Middle;Prefix;Suffix
        if (!result.contact) {
          const nameParts = value.split(';').filter(p => p);
          result.contact = nameParts.join(' ').trim();
        }
        break;

      case 'EMAIL':
        // Email address
        if (!result.email) {
          result.email = value;
        }
        break;

      case 'TEL':
        // Phone number - check if it's mobile
        const isMobile = fieldPart.toUpperCase().includes('CELL') ||
                        fieldPart.toUpperCase().includes('MOBILE') ||
                        value.startsWith('04') ||
                        value.startsWith('+614');

        if (isMobile && !result.mobile) {
          result.mobile = cleanPhoneNumber(value);
        }
        break;

      case 'ADR':
        // Address: ;;Street;City;State;PostalCode;Country
        if (!result.address) {
          const addrParts = value.split(';').filter(p => p);
          result.address = addrParts.join(', ');
        }
        break;

      case 'NOTE':
        // Sometimes ABN is in notes
        const abnMatch = value.match(/ABN[:\s]*(\d{11}|\d{2}\s\d{3}\s\d{3}\s\d{3})/i);
        if (abnMatch && !result.abn) {
          result.abn = abnMatch[1].replace(/\s/g, '');
        }
        break;
    }
  }

  return result;
}

/**
 * Clean and format phone number
 */
function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If starts with 61 (without +), add +
  if (cleaned.startsWith('61') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  // Format if it's a valid Australian mobile
  if (cleaned.startsWith('+614') && cleaned.length === 12) {
    return cleaned.replace(/(\+61)(\d)(\d{2})(\d{3})(\d{3})/, '$1 $2$3 $4 $5');
  } else if (cleaned.startsWith('04') && cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  return cleaned;
}

/**
 * Check if content is a vCard
 */
export function isVCard(content: string): boolean {
  return content.includes('BEGIN:VCARD') && content.includes('END:VCARD');
}
