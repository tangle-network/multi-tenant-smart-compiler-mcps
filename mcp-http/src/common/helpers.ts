/**
 * Utility function to create standardized error response
 */
export function createErrorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    error: message
  };
}

/**
 * Utility function to create standardized success response
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message })
  };
} 