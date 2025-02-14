/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as fs from 'fs/promises';

class Locale {
  private static availables: string[] = ['en', 'fr']; // Languages available
  private static locale: string = 'en'; // Represents the current locale
  private static locales: Record<string, any> = {}; // Represents translation keys
  private static initialized: boolean = false; //Indicates if the locale files is loaded

  /**
   * Initialize locale in the application.
   */
  public static async init(): Promise<void> {
    if (!Locale.initialized) {
      await Locale.loadLanguageFile(Locale.locale);
      Locale.initialized = true;
    }
  }

  /**
   * Get available locales.
   */
  public static getAvailableLocales(): string[] {
    return Locale.availables;
  }

  /**
   * Set the current locale.
   */
  public static async setLocale(locale: string): Promise<void> {
    if (!Locale.availables.includes(locale)) {
      throw new Error(`Locale "${locale}" is not supported.`);
    }
    Locale.locale = locale;
    if (!Locale.locales[locale]) {
      await Locale.loadLanguageFile(locale);
    }
  }

  /**
   * Get the text based on the current locale.
   */
  public static getLocale(): string {
    return Locale.locale;
  }

  /**
   * Retourne une traduction avec des paramètres dynamiques.
   */
  public static trans(key: string, params: Record<string, string> = {}, defaultValue: string = ''): string {
    let message = Locale.locales[Locale.locale]?.[key] || Locale.locales['en']?.[key] || defaultValue;

    for (const [paramKey, paramValue] of Object.entries(params)) {
      message = message.replace(`{${paramKey}}`, paramValue);
    }

    return message;
  }

  /**
   * Load all the locale files to get translation keys and values.
   */
  private static async loadLanguageFile(locale: string): Promise<void> {
    const langFolderPath = path.join(__dirname, '../../locale', locale);
    
    try {
      const files = await fs.readdir(langFolderPath);
      Locale.locales[locale] = {};

      for (const file of files) {
        const filePath = path.join(langFolderPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        Locale.locales[locale] = { ...Locale.locales[locale], ...JSON.parse(content) };
      }
    } catch (error) {
      console.error(`Failed to load locale files for "${locale}":`, error);
    }
  }
}

export { Locale };
