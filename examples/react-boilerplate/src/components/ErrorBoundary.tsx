/**
 * ErrorBoundary Component
 * 
 * React error boundary that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the component tree.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">
              {this.state.errorCount > 1
                ? `We've encountered ${this.state.errorCount} errors. The application may be unstable.`
                : "We're sorry, but something unexpected happened. Please try again."}
            </p>

            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleReset}>
                Try Again
              </button>
              <button className="btn btn-secondary" onClick={this.handleReload}>
                Reload Page
              </button>
            </div>

            {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
              <details className="error-details">
                <summary>Technical Details (for developers)</summary>
                <div className="error-details-content">
                  <div className="error-section">
                    <h4>Error Message:</h4>
                    <pre className="error-code">{this.state.error.toString()}</pre>
                  </div>

                  {this.state.error.stack && (
                    <div className="error-section">
                      <h4>Stack Trace:</h4>
                      <pre className="error-code">{this.state.error.stack}</pre>
                    </div>
                  )}

                  {this.state.errorInfo && (
                    <div className="error-section">
                      <h4>Component Stack:</h4>
                      <pre className="error-code">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="error-help">
              <p><strong>Need help?</strong></p>
              <ul>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Make sure your wallet extension is unlocked</li>
                <li>Try using a different browser</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional error boundary wrapper using react-error-boundary (optional)
 * 
 * Install: npm install react-error-boundary
 * 
 * Usage:
 * import { ErrorBoundary } from 'react-error-boundary';
 * 
 * <ErrorBoundary FallbackComponent={ErrorFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <div className="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p className="error-message">{error.message}</p>
        
        <div className="error-actions">
          <button className="btn btn-primary" onClick={resetErrorBoundary}>
            Try again
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre className="error-code">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;


