import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

/**
 * Strips all HTML tags.
 */
export const sanitizePlainText = (input: string): string => {
  if (!input) return input;
  return purify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Standard sanitize alias.
 */
export const sanitize = sanitizePlainText;

/**
 * Allows basic formatting tags for the rich text editor if needed, 
 * but currently strictly strips all per Section 4C requirement.
 */
export const sanitizeRichText = (input: string): string => {
  if (!input) return input;
  // Based on "ALLOWED_TAGS: []" requirement for security hardening:
  return purify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Sanitizes an object by stripping HTML from all string values.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      result[key] = sanitizePlainText(result[key]) as any;
    }
  }
  return result;
};
