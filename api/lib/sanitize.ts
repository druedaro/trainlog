

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const DNI_NIE_REGEX = /[XYZxyz]?\d{7,8}[A-Za-z]/g;

const PHONE_REGEX = /(?:\+?34\s?)?(?:6|7|8|9)\d{2}(?:\s?\d{2}){3}/g; 

export function sanitizePII(text: string): string {
  if (!text) return text;

  let sanitized = text;

  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_CENSURADO]');

  sanitized = sanitized.replace(DNI_NIE_REGEX, '[DNI_CENSURADO]');

  sanitized = sanitized.replace(PHONE_REGEX, '[TELÉFONO_CENSURADO]');

  return sanitized;
}
