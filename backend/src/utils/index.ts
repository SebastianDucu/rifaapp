import xss from 'xss';

/**
 * Sanitiza un string contra XSS
 */
export function sanitize(input: string): string {
  return xss(input.trim());
}

/**
 * Sanitiza recursivamente un objeto
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitize(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return result;
}

/**
 * Genera un slug a partir de un string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Formatea un número con ceros a la izquierda
 */
export function padNumber(num: number, totalTickets: number, zeroPad: boolean): string {
  if (!zeroPad) return num.toString();
  const digits = totalTickets.toString().length;
  return num.toString().padStart(digits, '0');
}

/**
 * Genera un ID aleatorio corto para slugs únicos
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

