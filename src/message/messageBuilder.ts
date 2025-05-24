/**
 * Builds a login message by replacing placeholders in the template with provided parameters.
 * @param params - An object containing the template and values for address, nonce, and issuedAt.
 * @returns A promise that resolves to the login message with placeholders replaced.
 * @throws Will throw an error if a placeholder is present in the template but not provided in params.
 */
export async function buildLoginMessage(params: {
  template: string;
  address: string;
  nonce: string | undefined;
  issuedAt: string;
}): Promise<string> {
  const { template, address, nonce, issuedAt } = params;

  const placeholders = { address, nonce, issuedAt };

  let message = template;

  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    if (message.includes(placeholder)) {
      if (value === undefined) {
        throw new Error(`Missing placeholder: ${key}`);
      }
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }
  }

  return message;
}
