export const ERROR_CODES = {
  // Message validation errors
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  MESSAGE_FUTURE: 'MESSAGE_FUTURE',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',

  // Signature validation errors
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  INVALID_SIGNATURE_LENGTH: 'INVALID_SIGNATURE_LENGTH',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',

  // Request validation errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_ADDRESS: 'INVALID_ADDRESS',

  // Success code
  SUCCESS: 'SUCCESS'
} as const;

// Maximum allowed message length
export const MAX_MESSAGE_LENGTH = 256;

// Clock skew tolerance in milliseconds (1 minute)
export const CLOCK_SKEW_TOLERANCE = 60 * 1000;

// Message expiration time in milliseconds (5 minutes)
export const MESSAGE_EXPIRATION_TIME = 5 * 60 * 1000; 