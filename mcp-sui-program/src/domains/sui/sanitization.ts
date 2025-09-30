/**
 * Sanitizes a test filter string to prevent command injection
 * @param filter The filter string to sanitize
 * @returns Sanitized filter string
 */
export function sanitizeSuiFuncTestFilter(filter: string): string {
  // Remove null bytes and control characters
  const cleaned = filter.replace(/[\x00-\x1f\x7f-\x9f]/g, "");

  // Check for command injection attempts
  if (/[;&|`$(){}[\]\\<>]/.test(cleaned)) {
    throw new Error(
      `Invalid test filter: ${filter}. Filter contains unsafe characters.`,
    );
  }

  // Validate that the filter follows the expected pattern for Sui test filters
  // Sui filters should be in the format: addr::module::function or partial matches
  if (cleaned && !/^[a-zA-Z0-9_:]+$/.test(cleaned)) {
    throw new Error(
      `Invalid test filter: ${filter}. Filter must contain only alphanumeric characters, underscores, and colons.`,
    );
  }

  return cleaned;
}
