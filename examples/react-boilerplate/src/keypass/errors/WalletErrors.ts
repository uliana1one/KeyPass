export class WalletError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletName: string) {
    super(`${walletName} wallet not found`, 'WALLET_NOT_FOUND');
    this.name = 'WalletNotFoundError';
  }
}

export type WalletOperation =
  | 'connection'
  | 'signing'
  | 'account_access'
  | 'wallet_connection'
  | 'message_signing';

export class UserRejectedError extends WalletError {
  constructor(operation: WalletOperation) {
    let message: string;
    switch (operation) {
      case 'connection':
      case 'wallet_connection':
        message = 'User rejected wallet connection';
        break;
      case 'signing':
      case 'message_signing':
        message = 'User rejected message signing';
        break;
      case 'account_access':
        message = 'User rejected account access';
        break;
      default:
        message = 'User rejected operation';
    }
    super(message, 'USER_REJECTED');
    this.name = 'UserRejectedError';
  }
}

export class TimeoutError extends WalletError {
  constructor(operation: WalletOperation) {
    const message =
      operation === 'wallet_connection'
        ? 'wallet connection timed out'
        : operation === 'message_signing'
          ? 'message signing timed out'
          : 'operation timed out';
    super(message, 'OPERATION_TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class InvalidSignatureError extends WalletError {
  constructor(message = 'Invalid signature') {
    super(message, 'INVALID_SIGNATURE');
    this.name = 'InvalidSignatureError';
  }
}

export class InvalidAddressError extends WalletError {
  constructor(address: string) {
    super(`Invalid address format: ${address}`, 'ADDRESS_VALIDATION_ERROR');
    this.name = 'InvalidAddressError';
  }
}

export class ConfigurationError extends WalletError {
  constructor(message: string) {
    super(message, 'INVALID_CONFIG');
    this.name = 'ConfigurationError';
  }
}

export class WalletConnectionError extends WalletError {
  constructor(message: string) {
    super(message, 'CONNECTION_FAILED');
    this.name = 'WalletConnectionError';
  }
}

export class MessageValidationError extends WalletError {
  constructor(message: string) {
    super(message, 'INVALID_MESSAGE');
    this.name = 'MessageValidationError';
  }
}

export class AddressValidationError extends WalletError {
  constructor(message: string) {
    super(message, 'INVALID_ADDRESS');
    this.name = 'AddressValidationError';
  }
}
