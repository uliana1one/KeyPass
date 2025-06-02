/**
 * Builds a login message by replacing placeholders in the template with provided parameters.
 * @param params - An object containing the template and values for address, nonce, and issuedAt.
 * @returns A promise that resolves to the login message with placeholders replaced.
 * @throws Will throw an error if a placeholder is present in the template but not provided in params.
 */
export async function buildLoginMessage(params: MessageParams): Promise<string> {
  const { template, ...placeholders } = params;

  // Validate template
  if (template === undefined) {
    throw new Error('Template is required');
  }
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }

  let message = template;

  // First, temporarily replace escaped placeholders with a unique marker
  const escapedPlaceholders = new Map<string, string>();
  message = message.replace(/\\{{([^}]+)}}/g, (match, content) => {
    const marker = `__ESCAPED_${escapedPlaceholders.size}__`;
    escapedPlaceholders.set(marker, match);
    return marker;
  });

  // Replace unescaped placeholders
  for (const [key, value] of Object.entries(placeholders)) {
    // Match placeholders with optional whitespace
    const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    if (placeholderRegex.test(message)) {
      if (value === undefined) {
        throw new Error(`Missing placeholder: ${key}`);
      }
      message = message.replace(placeholderRegex, value);
    }
  }

  // Restore escaped placeholders (without the escape character)
  for (const [marker, original] of escapedPlaceholders) {
    message = message.replace(marker, original.replace('\\', ''));
  }

  return message;
}

export interface MessageParams {
  template: string;
  address: string;
  nonce: string | undefined; // Allow undefined for testing
  issuedAt: string;
}
