import es from './locales/es.json';

type TranslationKeys = typeof es;

const translations: Record<string, TranslationKeys> = {
  es,
};

let currentLocale = 'es';

/**
 * Obtener una traducción por clave usando dot notation
 * Ejemplo: t('auth.loginTitle') => "Iniciar Sesión"
 */
export function t(key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[currentLocale];

  for (const k of keys) {
    if (result && typeof result === 'object') {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key; // Fallback al key si no existe
    }
  }

  return typeof result === 'string' ? result : key;
}

/**
 * Cambiar idioma activo
 */
export function setLocale(locale: string) {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

/**
 * Obtener idioma actual
 */
export function getLocale(): string {
  return currentLocale;
}

