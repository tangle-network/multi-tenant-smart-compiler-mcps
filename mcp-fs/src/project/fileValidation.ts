/**
 * Utility functions for file name validation and URL decoding
 */

/**
 * Validates and decodes a file name that may be URL-encoded
 * @param fileName - The file name to validate (may be URL-encoded)
 * @returns The decoded and validated file name
 * @throws Error if validation fails
 */
export function validateAndDecodeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") {
    throw new Error("File name is required and must be a string");
  }

  // Decode URL-encoded string if needed
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(fileName);
  } catch (error) {
    // If decoding fails, use original value
    decodedPath = fileName;
  }

  // Check for directory traversal attempts
  if (
    decodedPath.includes("..") ||
    decodedPath.startsWith("/") ||
    decodedPath.startsWith("\\")
  ) {
    throw new Error(
      "File name/path cannot contain directory traversal or absolute paths",
    );
  }

  // Allow alphanumeric characters, dots, hyphens, underscores, and forward slashes
  // This allows file paths like "data/state.json" or "contracts/deployments/config.json"
  if (!/^[a-zA-Z0-9._/-]+$/.test(decodedPath)) {
    throw new Error(
      "File name/path must contain only alphanumeric characters, dots, hyphens, underscores, and forward slashes",
    );
  }

  return decodedPath;
}

/**
 * Checks if a string is URL-encoded
 * @param str - The string to check
 * @returns true if the string appears to be URL-encoded
 */
export function isUrlEncoded(str: string): boolean {
  return str.includes("%") && /%[0-9A-Fa-f]{2}/.test(str);
}

/**
 * Safely decodes a URL-encoded string, returning the original if decoding fails
 * @param str - The string to decode
 * @returns The decoded string or original if decoding fails
 */
export function safeUrlDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (error) {
    return str;
  }
}
