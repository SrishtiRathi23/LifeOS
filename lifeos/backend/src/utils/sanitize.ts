import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(input: string) {
  return sanitizeHtml(input, {
    allowedTags: ["p", "b", "i", "em", "strong", "u", "ul", "ol", "li", "blockquote", "br", "h1", "h2", "h3"],
    allowedAttributes: {}
  });
}

export function sanitizePlainText(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}
