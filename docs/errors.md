# Error Handling Guide

This guide provides comprehensive documentation for error handling in the KeyPass Login SDK, including **wallet and account selection** error scenarios, **multi-chain support**, **SBT/credential flows**, and best practices for creating robust user experiences.

## Error Types

### SDK Errors

#### `WalletError` (Base Class)
Base error class for all wallet-related errors.

```typescript
class WalletError extends Error {
  constructor(message: string, code: string);
}
```

#### `WalletNotFoundError`
Thrown when the requested wallet extension is not found.

```typescript
class WalletNotFoundError extends WalletError {
  constructor(walletName: string);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    console.error(`Wallet ${error.walletName} not found`);
    // Prompt user to install wallet
  }
}
```

#### `UserRejectedError`
Thrown when the user rejects a wallet operation.

```typescript
class UserRejectedError extends WalletError {
  constructor(operation: WalletOperation);
}

type WalletOperation = 'connection' | 'signing' | 'account_access' | 'wallet_connection' | 'message_signing';
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof UserRejectedError) {
    console.error(`User rejected ${error.operation}`);
    // Handle user rejection
  }
}
```

#### `TimeoutError`
Thrown when a wallet operation times out.

```typescript
class TimeoutError extends WalletError {
  constructor(operation: WalletOperation);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot(3); // Retry 3 times
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error(`Operation ${error.operation} timed out`);
    // Handle timeout
  }
}
```

#### `InvalidSignatureError`
Thrown when signature validation fails.

```typescript
class InvalidSignatureError extends WalletError {
  constructor(message?: string);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof InvalidSignatureError) {
    console.error(`Signature validation failed: ${error.message}`);
    // Handle signature error
  }
}
```

#### `InvalidAddressError`
Thrown when an address format is invalid.

```typescript
class InvalidAddressError extends WalletError {
  constructor(address: string);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof InvalidAddressError) {
    console.error(`Invalid address format: ${error.address}`);
    // Handle invalid address
  }
}
```

#### `ConfigurationError`
Thrown when there's an issue with SDK configuration.

```typescript
class ConfigurationError extends WalletError {
  constructor(message: string);
}
```

**Example:**
```typescript
try {
  await initializeSDK(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Configuration error: ${error.message}`);
    // Handle configuration issue
  }
}
```

#### `WalletConnectionError`
Thrown when there's a failure in wallet connection.

```typescript
class WalletConnectionError extends WalletError {
  constructor(message: string);
}
```

**Example:**
```typescript
try {
  await connectWallet();
} catch (error) {
  if (error instanceof WalletConnectionError) {
    console.error(`Wallet connection failed: ${error.message}`);
    // Handle connection failure
  }
}
```

#### `MessageValidationError`
Thrown when message validation fails.

```typescript
class MessageValidationError extends WalletError {
  constructor(message: string);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof MessageValidationError) {
    console.error(`Message validation failed: ${error.message}`);
    // Handle validation error
  }
}
```

#### `AddressValidationError`
Thrown when address validation fails.

```typescript
class AddressValidationError extends WalletError {
  constructor(message: string);
}
```

**Example:**
```typescript
try {
  await loginWithPolkadot();
} catch (error) {
  if (error instanceof AddressValidationError) {
    console.error(`Address validation failed: ${error.message}`);
    // Handle validation error
  }
}
```

#### `SBTServiceError`
Thrown for errors in SBT/credential service operations.

```typescript
class SBTServiceError extends Error {
  public readonly code: string;
  public readonly chainType?: SBTChainType;
  public readonly contractAddress?: string;

  constructor(
    message: string,
    code: string,
    chainType?: SBTChainType,
    contractAddress?: string
  );
}
```

**Example:**
```typescript
try {
  const tokens = await sbtService.getTokens(address);
} catch (error) {
  if (error instanceof SBTServiceError) {
    console.error(`SBT error: ${error.message}`);
    console.error(`Chain: ${error.chainType}`);
    console.error(`Contract: ${error.contractAddress}`);
    // Handle SBT service error
  }
}
```

### SDK Error Codes

| Error Class                | Error Code                  | Description                                 |
|----------------------------|-----------------------------|---------------------------------------------|
| WalletNotFoundError        | WALLET_NOT_FOUND            | Wallet extension not found                  |
| UserRejectedError          | USER_REJECTED               | User rejected wallet operation              |
| TimeoutError               | OPERATION_TIMEOUT           | Operation timed out                         |
| InvalidSignatureError      | INVALID_SIGNATURE           | Signature is invalid                        |
| InvalidAddressError        | ADDRESS_VALIDATION_ERROR    | Address format is invalid                   |
| ConfigurationError         | INVALID_CONFIG              | SDK configuration error                     |
| WalletConnectionError      | CONNECTION_FAILED           | Wallet connection failed                    |
| MessageValidationError     | INVALID_MESSAGE             | Message validation failed                   |
| AddressValidationError     | INVALID_ADDRESS             | Address validation failed                   |
| SBTServiceError            | (varies, see below)         | SBT/credential service error                |

### SBT Service Error Codes

| Code                      | Description                                      |
|---------------------------|--------------------------------------------------|
| MOONBEAM_FETCH_ERROR      | Failed to fetch tokens from Moonbeam            |
| MOONBEAM_COLLECTIONS_ERROR| Failed to fetch collections from Moonbeam        |
| MOONBEAM_METADATA_ERROR   | Failed to fetch token metadata from Moonbeam    |
| MOONBEAM_OWNERSHIP_ERROR  | Failed to verify token ownership on Moonbeam    |
| ETHEREUM_FETCH_ERROR      | Failed to fetch tokens from Ethereum            |
| ETHEREUM_COLLECTIONS_ERROR| Failed to fetch collections from Ethereum        |
| ETHEREUM_METADATA_ERROR   | Failed to fetch token metadata from Ethereum    |
| ETHEREUM_OWNERSHIP_ERROR  | Failed to verify token ownership on Ethereum    |

### API Errors

#### Error Codes

```typescript
const ERROR_CODES = {
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

  // Multi-chain support errors
  UNSUPPORTED_CHAIN_TYPE: 'UNSUPPORTED_CHAIN_TYPE',
  UNKNOWN_ADDRESS_FORMAT: 'UNKNOWN_ADDRESS_FORMAT',

  // DID creation errors
  DID_CREATION_FAILED: 'DID_CREATION_FAILED',

  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Success code
  SUCCESS: 'SUCCESS',
} as const;
```

#### Error Responses

All API errors follow this format:

```typescript
interface ErrorResponse {
  status: 'error';
  message: string;
  code: string;
  details?: unknown;
}
```

**Example Response:**
```json
{
  "status": "error",
  "message": "Invalid signature format",
  "code": "INVALID_SIGNATURE_FORMAT",
  "details": {
    "expected": "0x-prefixed hex string",
    "received": "raw hex string"
  }
}
```

### Multi-Chain Error Handling

#### Chain Type Detection Errors

```typescript
// Unsupported chain type
{
  status: 'error',
  message: 'Unsupported chain type: bitcoin',
  code: 'UNSUPPORTED_CHAIN_TYPE'
}

// Unknown address format
{
  status: 'error',
  message: 'Unable to determine chain type from address format',
  code: 'UNKNOWN_ADDRESS_FORMAT'
}
```

#### Chain-Specific Validation

```typescript
// Ethereum address validation
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
  throw new AddressValidationError('Invalid Ethereum address format');
}

// Polkadot address validation
if (!/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
  throw new AddressValidationError('Invalid Polkadot address format');
}
```

## Error Handling Patterns

### 1. Client-Side Error Handling

```typescript
class KeyPassErrorHandler {
  static async handleLoginError(error: unknown): Promise<void> {
    if (error instanceof WalletNotFoundError) {
      await this.handleWalletNotFound(error);
    } else if (error instanceof UserRejectedError) {
      await this.handleUserRejection(error);
    } else if (error instanceof TimeoutError) {
      await this.handleTimeout(error);
    } else if (error instanceof MessageValidationError) {
      await this.handleValidationError(error);
    } else if (error instanceof InvalidAddressError) {
      await this.handleInvalidAddress(error);
    } else if (error instanceof WalletConnectionError) {
      await this.handleConnectionError(error);
    } else if (error instanceof ConfigurationError) {
      await this.handleConfigurationError(error);
    } else if (error instanceof SBTServiceError) {
      await this.handleSBTServiceError(error);
    } else {
      await this.handleUnknownError(error);
    }
  }

  private static async handleWalletNotFound(error: WalletNotFoundError): Promise<void> {
    // Show wallet installation prompt
    await showWalletInstallPrompt(error.walletName);
  }

  private static async handleUserRejection(error: UserRejectedError): Promise<void> {
    // Show user-friendly rejection message
    await showUserRejectionMessage(error.operation);
  }

  private static async handleTimeout(error: TimeoutError): Promise<void> {
    // Show timeout message and retry option
    await showTimeoutMessage(error.operation);
  }

  private static async handleValidationError(error: MessageValidationError | AddressValidationError): Promise<void> {
    // Show validation error message
    await showValidationError(error.message);
  }

  private static async handleInvalidAddress(error: InvalidAddressError): Promise<void> {
    // Show invalid address message
    await showInvalidAddressMessage(error.address);
  }

  private static async handleConnectionError(error: WalletConnectionError): Promise<void> {
    // Show connection error message
    await showConnectionErrorMessage(error.message);
  }

  private static async handleConfigurationError(error: ConfigurationError): Promise<void> {
    // Show configuration error message
    await showConfigurationErrorMessage(error.message);
  }

  private static async handleSBTServiceError(error: SBTServiceError): Promise<void> {
    // Show SBT service error with context
    await showSBTServiceError(error.message, error.chainType, error.contractAddress);
  }

  private static async handleUnknownError(error: unknown): Promise<void> {
    // Log error and show generic error message
    console.error('Unknown error:', error);
    await showGenericErrorMessage();
  }
}
```

### 2. Server-Side Error Handling

```typescript
class VerificationErrorHandler {
  static handleError(error: unknown): ErrorResponse {
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    } else if (error instanceof VerificationError) {
      return this.handleVerificationError(error);
    } else if (error instanceof SBTServiceError) {
      return this.handleSBTServiceError(error);
    } else {
      return this.handleUnknownError(error);
    }
  }

  private static handleValidationError(error: ValidationError): ErrorResponse {
    return {
      status: 'error',
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  private static handleVerificationError(error: VerificationError): ErrorResponse {
    return {
      status: 'error',
      message: 'Signature verification failed',
      code: ERROR_CODES.VERIFICATION_FAILED,
      details: {
        reason: error.message
      }
    };
  }

  private static handleSBTServiceError(error: SBTServiceError): ErrorResponse {
    return {
      status: 'error',
      message: error.message,
      code: error.code,
      details: {
        chainType: error.chainType,
        contractAddress: error.contractAddress
      }
    };
  }

  private static handleUnknownError(error: unknown): ErrorResponse {
    console.error('Unknown error:', error);
    return {
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
  }
}
```

### 3. Multi-Chain Error Handling

```typescript
class MultiChainErrorHandler {
  static async handleVerificationError(response: VerificationResponse): Promise<void> {
    switch (response.code) {
      case 'UNSUPPORTED_CHAIN_TYPE':
        await this.handleUnsupportedChain(response.message);
        break;
      case 'UNKNOWN_ADDRESS_FORMAT':
        await this.handleUnknownAddressFormat(response.message);
        break;
      case 'VERIFICATION_FAILED':
        await this.handleVerificationFailed(response.message);
        break;
      default:
        await this.handleGenericError(response.message);
    }
  }

  private static async handleUnsupportedChain(message: string): Promise<void> {
    // Show chain selection dialog or error message
    await showChainSelectionDialog();
  }

  private static async handleUnknownAddressFormat(message: string): Promise<void> {
    // Show address format help or validation error
    await showAddressFormatHelp();
  }

  private static async handleVerificationFailed(message: string): Promise<void> {
    // Show verification failed message with retry option
    await showVerificationFailedMessage(message);
  }

  private static async handleGenericError(message: string): Promise<void> {
    // Show generic error message
    await showGenericErrorMessage(message);
  }
}
```

## Best Practices

### 1. Error Logging

```typescript
class ErrorLogger {
  static logError(error: unknown, context: Record<string, unknown>): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: this.serializeError(error),
      context,
      stack: error instanceof Error ? error.stack : undefined
    };

    // Log to monitoring service
    this.sendToMonitoring(errorLog);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Log:', errorLog);
    }
  }

  private static serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        code: (error as any).code
      };
    }
    return { message: String(error) };
  }

  private static sendToMonitoring(log: unknown): void {
    // Implement monitoring service integration
  }
}
```

### 2. User-Friendly Messages

```typescript
const ERROR_MESSAGES = {
  [ERROR_CODES.VERIFICATION_FAILED]: 'Unable to verify your signature. Please try again.',
  [ERROR_CODES.INVALID_MESSAGE_FORMAT]: 'The login message is invalid. Please try again.',
  [ERROR_CODES.INVALID_REQUEST]: 'Invalid request. Please check your input.',
  [ERROR_CODES.MESSAGE_EXPIRED]: 'Your login session has expired. Please try again.',
  [ERROR_CODES.DID_CREATION_FAILED]: 'Unable to create your digital identity. Please try again.',
  [ERROR_CODES.UNSUPPORTED_CHAIN_TYPE]: 'This blockchain is not supported. Please use a supported chain.',
  [ERROR_CODES.UNKNOWN_ADDRESS_FORMAT]: 'Unable to recognize this address format. Please check your address.',
  // ... other error messages
} as const;

function getUserFriendlyMessage(code: string): string {
  return ERROR_MESSAGES[code] || 'An unexpected error occurred. Please try again.';
}
```

### 3. Error Recovery

```typescript
class ErrorRecovery {
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.isRetryableError(error)) {
          if (attempt < maxRetries) {
            await this.delay(delay * attempt);
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  private static isRetryableError(error: unknown): boolean {
    return (
      error instanceof TimeoutError ||
      error instanceof NetworkError ||
      (error instanceof Error && error.message.includes('network'))
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Chain-Specific Error Handling

```typescript
class ChainSpecificErrorHandler {
  static async handleChainError(error: unknown, chainType: 'polkadot' | 'ethereum'): Promise<void> {
    if (chainType === 'polkadot') {
      await this.handlePolkadotError(error);
    } else if (chainType === 'ethereum') {
      await this.handleEthereumError(error);
    }
  }

  private static async handlePolkadotError(error: unknown): Promise<void> {
    // Handle Polkadot-specific errors
    if (error instanceof AddressValidationError) {
      await showPolkadotAddressHelp();
    }
  }

  private static async handleEthereumError(error: unknown): Promise<void> {
    // Handle Ethereum-specific errors
    if (error instanceof AddressValidationError) {
      await showEthereumAddressHelp();
    }
  }
}
```

## Testing Error Handling

### 1. Unit Tests

```typescript
describe('Error Handling', () => {
  test('handles wallet not found error', async () => {
    const error = new WalletNotFoundError('polkadot');
    await expect(KeyPassErrorHandler.handleLoginError(error))
      .resolves.not.toThrow();
  });

  test('handles user rejection error', async () => {
    const error = new UserRejectedError('signing');
    await expect(KeyPassErrorHandler.handleLoginError(error))
      .resolves.not.toThrow();
  });

  test('handles SBT service error', async () => {
    const error = new SBTServiceError(
      'Failed to fetch tokens',
      'MOONBEAM_FETCH_ERROR',
      'MOONBEAM',
      '0x123...'
    );
    await expect(KeyPassErrorHandler.handleLoginError(error))
      .resolves.not.toThrow();
  });

  test('handles multi-chain errors', async () => {
    const response = {
      status: 'error',
      message: 'Unsupported chain type: bitcoin',
      code: 'UNSUPPORTED_CHAIN_TYPE'
    };
    await expect(MultiChainErrorHandler.handleVerificationError(response))
      .resolves.not.toThrow();
  });
});
```

### 2. Integration Tests

```typescript
describe('Error Recovery', () => {
  test('retries on timeout', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new TimeoutError('connect'))
      .mockResolvedValueOnce({ success: true });

    const result = await ErrorRecovery.retryOperation(operation);
    expect(result).toEqual({ success: true });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  test('fails after max retries', async () => {
    const error = new TimeoutError('connect');
    const operation = jest.fn().mockRejectedValue(error);

    await expect(ErrorRecovery.retryOperation(operation))
      .rejects.toThrow(error);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  test('handles SBT service errors', async () => {
    const sbtService = new SBTService(config);
    const error = new SBTServiceError(
      'Network error',
      'MOONBEAM_FETCH_ERROR',
      'MOONBEAM'
    );

    jest.spyOn(sbtService, 'getTokens').mockRejectedValue(error);
    
    await expect(sbtService.getTokens('0x123...'))
      .rejects.toThrow(SBTServiceError);
  });
});
```

## Support

For additional help with error handling:
- Check the [API Reference](./api.md) for error types and codes
- Review the [Integration Guide](./integration.md) for error handling patterns
- Open an issue on GitHub for specific error scenarios
- Join our Discord community for real-time support 