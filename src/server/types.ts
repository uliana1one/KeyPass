/**
 * Request body for the verification endpoint.
 */
export interface VerificationRequest {
  /** The message that was signed */
  message: string;
  /** The signature in hex format (0x-prefixed) */
  signature: string;
  /** The Polkadot address that signed the message */
  address: string;
}

/**
 * Response from the verification endpoint.
 */
export interface VerificationResponse {
  /** Response status ('success' or 'error') */
  status: 'success' | 'error';
  /** The message describing the result or error */
  message: string;
  /** The DID associated with the address, if verification was successful */
  did?: string;
  /** Error code for client handling */
  code: string;
}

/**
 * Error response from the verification endpoint.
 */
export interface VerificationError {
  /** Response status ('error') */
  status: 'error';
  /** Error message */
  message: string;
  /** Error code for client handling */
  code: string;
}
