/**
 * Request structure for signature verification
 */
export interface VerificationRequest {
  /** The message that was signed */
  message: string;
  /** The signature to verify */
  signature: string;
  /** The address that allegedly signed the message */
  address: string;
  /** Optional chain type for multi-chain support */
  chainType?: 'polkadot' | 'ethereum';
}

/**
 * Response structure for signature verification
 */
export interface VerificationResponse {
  /** Status of the verification */
  status: 'success' | 'error';
  /** Human-readable message */
  message: string;
  /** Error or success code */
  code: string;
  /** DID created for successful verifications */
  did?: string;
  /** Additional data for successful verifications */
  data?: Record<string, unknown>;
}

/**
 * Chain-specific verification service interface
 */
export interface VerificationService {
  verifySignature(request: VerificationRequest): Promise<VerificationResponse>;
}
