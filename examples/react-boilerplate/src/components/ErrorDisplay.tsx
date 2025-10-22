/**
 * ErrorDisplay Component
 * 
 * Displays user-friendly error messages with categorization and recovery suggestions.
 * Integrates with the KeyPass BlockchainErrors system.
 * 
 * Usage:
 * <ErrorDisplay error={error} onRetry={handleRetry} onDismiss={handleDismiss} />
 */

import React from 'react';
import './ErrorDisplay.css';

// Error categories matching BlockchainErrors
export enum ErrorCategory {
  NETWORK = 'network',
  CONTRACT = 'contract',
  USER = 'user',
  TRANSACTION = 'transaction',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ErrorDisplayProps {
  error: Error | BlockchainError | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

interface BlockchainError extends Error {
  code?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  retryable?: boolean;
  context?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false
}) => {
  // Parse error
  const errorObj = typeof error === 'string' 
    ? { message: error, name: 'Error' } as Error
    : error;

  const blockchainError = errorObj as BlockchainError;
  const category = blockchainError.category || detectErrorCategory(errorObj);
  const severity = blockchainError.severity || detectErrorSeverity(errorObj);
  const isRetryable = blockchainError.retryable !== undefined 
    ? blockchainError.retryable 
    : isErrorRetryable(category, errorObj);

  // Get user-friendly message and icon
  const { message, icon } = getUserFriendlyMessage(errorObj, category);
  const suggestions = getRecoverySuggestions(category, errorObj);

  if (compact) {
    return (
      <div className={`error-display-compact ${category} ${severity}`}>
        <span className="error-icon">{icon}</span>
        <span className="error-message">{message}</span>
        {onDismiss && (
          <button className="error-dismiss" onClick={onDismiss} aria-label="Dismiss">
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`error-display ${category} ${severity}`}>
      <div className="error-header">
        <div className="error-icon-large">{icon}</div>
        <div className="error-title">
          <h3>{getCategoryTitle(category)}</h3>
          {blockchainError.code && (
            <span className="error-code">Error Code: {blockchainError.code}</span>
          )}
        </div>
        {onDismiss && (
          <button className="error-close" onClick={onDismiss} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="error-body">
        <p className="error-message-full">{message}</p>

        {suggestions.length > 0 && (
          <div className="error-suggestions">
            <h4>How to fix this:</h4>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {isRetryable && onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            🔄 Try Again
          </button>
        )}

        {showDetails && (
          <details className="error-technical">
            <summary>Technical Details</summary>
            <div className="error-technical-content">
              <p><strong>Error Name:</strong> {errorObj.name}</p>
              <p><strong>Original Message:</strong> {errorObj.message}</p>
              {blockchainError.context && (
                <>
                  <p><strong>Context:</strong></p>
                  <pre>{JSON.stringify(blockchainError.context, null, 2)}</pre>
                </>
              )}
              {errorObj.stack && (
                <>
                  <p><strong>Stack Trace:</strong></p>
                  <pre>{errorObj.stack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Helper Functions

function detectErrorCategory(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }
  if (message.includes('contract') || message.includes('revert')) {
    return ErrorCategory.CONTRACT;
  }
  if (message.includes('insufficient') || message.includes('balance') || message.includes('funds')) {
    return ErrorCategory.USER;
  }
  if (message.includes('transaction') || message.includes('nonce') || message.includes('gas')) {
    return ErrorCategory.TRANSACTION;
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.SYSTEM;
}

function detectErrorSeverity(error: Error): ErrorSeverity {
  const message = error.message.toLowerCase();

  if (message.includes('critical') || message.includes('fatal')) {
    return ErrorSeverity.CRITICAL;
  }
  if (message.includes('failed') || message.includes('error')) {
    return ErrorSeverity.HIGH;
  }
  if (message.includes('warning')) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}

function isErrorRetryable(category: ErrorCategory, error: Error): boolean {
  // Network errors are typically retryable
  if (category === ErrorCategory.NETWORK) {
    return true;
  }

  // Some transaction errors are retryable
  if (category === ErrorCategory.TRANSACTION) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('nonce') || message.includes('pending');
  }

  // User and validation errors are usually not retryable
  return false;
}

function getCategoryTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection Issue';
    case ErrorCategory.CONTRACT:
      return 'Smart Contract Error';
    case ErrorCategory.USER:
      return 'Action Required';
    case ErrorCategory.TRANSACTION:
      return 'Transaction Failed';
    case ErrorCategory.VALIDATION:
      return 'Invalid Input';
    case ErrorCategory.SYSTEM:
      return 'System Error';
    default:
      return 'Error';
  }
}

function getUserFriendlyMessage(error: Error, category: ErrorCategory): { message: string; icon: string } {
  const originalMessage = error.message.toLowerCase();

  // Network errors
  if (category === ErrorCategory.NETWORK) {
    if (originalMessage.includes('timeout')) {
      return {
        message: 'Connection timed out. Please check your internet connection and try again.',
        icon: '🌐'
      };
    }
    if (originalMessage.includes('connection')) {
      return {
        message: 'Unable to connect to the blockchain network. Please check your connection and try again.',
        icon: '🔌'
      };
    }
    return {
      message: 'A network error occurred. Please check your connection and try again.',
      icon: '🌐'
    };
  }

  // Contract errors
  if (category === ErrorCategory.CONTRACT) {
    if (originalMessage.includes('revert')) {
      return {
        message: 'The smart contract rejected this transaction. Please check the requirements and try again.',
        icon: '📜'
      };
    }
    return {
      message: 'The smart contract encountered an error. Please contact support if this persists.',
      icon: '📜'
    };
  }

  // User errors
  if (category === ErrorCategory.USER) {
    if (originalMessage.includes('insufficient') || originalMessage.includes('balance')) {
      return {
        message: 'Insufficient balance to complete this transaction. Please add funds and try again.',
        icon: '💰'
      };
    }
    return {
      message: 'Please check your input and try again.',
      icon: '👤'
    };
  }

  // Transaction errors
  if (category === ErrorCategory.TRANSACTION) {
    if (originalMessage.includes('gas')) {
      return {
        message: 'Transaction failed due to insufficient gas. Please try again with a higher gas limit.',
        icon: '⛽'
      };
    }
    if (originalMessage.includes('nonce')) {
      return {
        message: 'Transaction sequence error. Please wait a moment and try again.',
        icon: '🔢'
      };
    }
    return {
      message: 'Transaction failed to complete. Please try again.',
      icon: '📤'
    };
  }

  // Validation errors
  if (category === ErrorCategory.VALIDATION) {
    return {
      message: 'Please check your input values and try again.',
      icon: '✏️'
    };
  }

  // Default
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    icon: '⚠️'
  };
}

function getRecoverySuggestions(category: ErrorCategory, error: Error): string[] {
  const suggestions: string[] = [];
  const message = error.message.toLowerCase();

  switch (category) {
    case ErrorCategory.NETWORK:
      suggestions.push('Check your internet connection');
      suggestions.push('Verify your wallet extension is unlocked');
      suggestions.push('Try switching to a different RPC endpoint');
      suggestions.push('Wait a few moments and try again');
      break;

    case ErrorCategory.CONTRACT:
      if (message.includes('revert')) {
        suggestions.push('Ensure you meet all contract requirements');
        suggestions.push('Check if the contract is paused or disabled');
        suggestions.push('Verify you have the necessary permissions');
      } else {
        suggestions.push('Contact support with error details');
        suggestions.push('Check the contract status on the blockchain explorer');
      }
      break;

    case ErrorCategory.USER:
      if (message.includes('insufficient') || message.includes('balance')) {
        suggestions.push('Add funds to your wallet');
        suggestions.push('Visit a testnet faucet if using testnet');
        suggestions.push('Verify you have enough tokens for gas fees');
      } else {
        suggestions.push('Double-check your wallet address');
        suggestions.push('Ensure your wallet is properly connected');
      }
      break;

    case ErrorCategory.TRANSACTION:
      if (message.includes('gas')) {
        suggestions.push('Increase the gas limit for this transaction');
        suggestions.push('Ensure you have enough tokens for gas fees');
      } else if (message.includes('nonce')) {
        suggestions.push('Wait for pending transactions to complete');
        suggestions.push('Reset your wallet if the problem persists');
      } else {
        suggestions.push('Wait a few moments and try again');
        suggestions.push('Check the transaction status on the blockchain explorer');
      }
      break;

    case ErrorCategory.VALIDATION:
      suggestions.push('Verify all required fields are filled correctly');
      suggestions.push('Check the format of addresses and amounts');
      suggestions.push('Ensure values are within acceptable ranges');
      break;

    case ErrorCategory.SYSTEM:
      suggestions.push('Refresh the page and try again');
      suggestions.push('Clear your browser cache');
      suggestions.push('Try using a different browser');
      suggestions.push('Contact support if the problem persists');
      break;
  }

  return suggestions;
}

export default ErrorDisplay;


