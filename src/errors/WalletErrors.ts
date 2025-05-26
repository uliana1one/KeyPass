export class WalletError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(walletName: string) {
    super(`${walletName} wallet not found`, 'WALLET_NOT_FOUND');
  }
}

export class UserRejectedError extends WalletError {
  constructor(operation: string) {
    super(`User rejected ${operation}`, 'USER_REJECTED');
  }
}

export class TimeoutError extends WalletError {
  constructor(operation: string) {
    super(`${operation} timed out`, 'OPERATION_TIMEOUT');
  }
}

export class InvalidSignatureError extends WalletError {
  constructor() {
    super('Invalid signature format', 'INVALID_SIGNATURE');
  }
}

export class InvalidAddressError extends WalletError {
  constructor(address: string) {
    super(`Invalid address format: ${address}`, 'INVALID_ADDRESS');
  }
}

export class ConfigurationError extends WalletError {
  constructor(message: string) {
    super(message, 'INVALID_CONFIG');
  }
}

export class WalletConnectionError extends WalletError {
  constructor(message: string) {
    super(message, 'CONNECTION_FAILED');
  }
}

export class MessageValidationError extends WalletError {
  constructor(message = 'Invalid message format or content') {
    super(message, 'MESSAGE_VALIDATION_ERROR');
  }
}

export class AddressValidationError extends WalletError {
  constructor(message = 'Invalid Polkadot address or checksum') {
    super(message, 'ADDRESS_VALIDATION_ERROR');
  }
} 