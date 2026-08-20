/**
 * Utility to sanitize Personally Identifiable Information (PII) 
 * from text before sending it to third-party LLMs (Groq, Google).
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const DNI_NIE_REGEX = /[XYZxyz]?\d{7,8}[A-Za-z]/g;
// Basic regex to catch Spanish and international phone numbers
const PHONE_REGEX = /(?:\+?34\s?)?(?:6|7|8|9)\d{2}(?:\s?\d{2}){3}/g; 

export function sanitizePII(text: string): string {
  if (!text) return text;

  let sanitized = text;

  // Mask Emails
  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_CENSURADO]');
  
  // Mask DNI / NIE
  sanitized = sanitized.replace(DNI_NIE_REGEX, '[DNI_CENSURADO]');
  
  // Mask Phone numbers
  sanitized = sanitized.replace(PHONE_REGEX, '[TELÉFONO_CENSURADO]');

  return sanitized;
}
