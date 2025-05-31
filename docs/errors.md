# Error Handling Guide

This guide provides comprehensive documentation for error handling in the KeyPass Login SDK.

## Error Types

### SDK Errors

#### `WalletNotFoundError`
Thrown when the requested wallet extension is not found.

```typescript
class WalletNotFoundError extends Error {
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
class UserRejectedError extends Error {
  constructor(operation: string);
}
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
class TimeoutError extends Error {
  constructor(operation: string);
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

#### `MessageValidationError`
Thrown when message validation fails.

```typescript
class MessageValidationError extends Error {
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
class AddressValidationError extends Error {
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

### API Errors

#### Error Codes

```typescript
const ERROR_CODES = {
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INVALID_SIGNATURE_FORMAT: 'INVALID_SIGNATURE_FORMAT',
  INVALID_SIGNATURE_LENGTH: 'INVALID_SIGNATURE_LENGTH',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  MESSAGE_EXPIRED: 'MESSAGE_EXPIRED',
  MESSAGE_FUTURE: 'MESSAGE_FUTURE',
  DID_CREATION_FAILED: 'DID_CREATION_FAILED'
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
    const error = new UserRejectedError('sign');
    await expect(KeyPassErrorHandler.handleLoginError(error))
      .resolves.not.toThrow();
  });

  test('handles validation error', async () => {
    const error = new MessageValidationError('Invalid message format');
    await expect(KeyPassErrorHandler.handleLoginError(error))
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
});
```

## Support

For additional help with error handling:
- Check the [API Reference](./api.md) for error types and codes
- Review the [Integration Guide](./integration.md) for error handling patterns
- Open an issue on GitHub for specific error scenarios
- Join our Discord community for real-time support 