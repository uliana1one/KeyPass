import { useState, useCallback } from 'react';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
  errorCode?: string;
  errorCategory?: string;
  errorSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  retryable?: boolean;
  maxRetries?: number;
}

export const useErrorHandling = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: '',
  });

  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlingOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = true,
      retryable = false,
      maxRetries = 3
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Extract error details if it's a blockchain error
    let errorCode: string | undefined;
    let errorCategory: string | undefined;
    let errorSeverity: 'low' | 'medium' | 'high' | 'critical' | undefined;

    if ('code' in errorObj && typeof errorObj.code === 'string') {
      errorCode = errorObj.code;
    }

    if ('category' in errorObj && typeof errorObj.category === 'string') {
      errorCategory = errorObj.category;
    }

    if ('severity' in errorObj && typeof errorObj.severity === 'string') {
      errorSeverity = errorObj.severity as 'low' | 'medium' | 'high' | 'critical';
    }

    const newErrorState: ErrorState = {
      error: errorObj,
      isError: true,
      errorMessage: errorObj.message,
      errorCode,
      errorCategory,
      errorSeverity,
    };

    setErrorState(newErrorState);

    if (logToConsole) {
      console.error('Error handled:', {
        message: errorObj.message,
        code: errorCode,
        category: errorCategory,
        severity: errorSeverity,
        stack: errorObj.stack,
      });
    }

    if (showToast) {
      // In a real app, you'd show a toast notification here
      console.warn('Toast notification:', errorObj.message);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: '',
    });
    setRetryCount(0);
  }, []);

  const retry = useCallback(async (
    retryFn: () => Promise<void>,
    options: ErrorHandlingOptions = {}
  ) => {
    const { maxRetries = 3 } = options;

    if (retryCount >= maxRetries) {
      handleError('Maximum retry attempts reached', options);
      return;
    }

    try {
      setRetryCount(prev => prev + 1);
      await retryFn();
      clearError();
    } catch (error) {
      handleError(error as Error, options);
    }
  }, [retryCount, handleError, clearError]);

  const isRetryable = useCallback((error: Error): boolean => {
    // Check if error is retryable based on error code or type
    if ('code' in error && typeof error.code === 'string') {
      const retryableCodes = [
        'NETWORK_ERROR',
        'CONNECTION_FAILED',
        'TIMEOUT',
        'RPC_ERROR',
        'TRANSACTION_TIMEOUT',
      ];
      return retryableCodes.some(code => error.code.includes(code));
    }

    // Check error message for retryable patterns
    const retryablePatterns = [
      'network',
      'connection',
      'timeout',
      'temporary',
      'retry',
    ];
    
    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }, []);

  const getErrorMessage = useCallback((error: Error): string => {
    // Return user-friendly error messages
    if ('code' in error && typeof error.code === 'string') {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'Network connection failed. Please check your internet connection and try again.';
        case 'CONNECTION_FAILED':
          return 'Failed to connect to the blockchain. Please try again.';
        case 'TIMEOUT':
          return 'The operation timed out. Please try again.';
        case 'INSUFFICIENT_BALANCE':
          return 'Insufficient balance to complete the transaction.';
        case 'USER_REJECTED':
          return 'Transaction was rejected by the user.';
        case 'GAS_ESTIMATION_FAILED':
          return 'Failed to estimate gas. Please try again or increase gas limit.';
        default:
          return error.message;
      }
    }

    return error.message;
  }, []);

  return {
    errorState,
    handleError,
    clearError,
    retry,
    isRetryable,
    getErrorMessage,
    retryCount,
  };
};
