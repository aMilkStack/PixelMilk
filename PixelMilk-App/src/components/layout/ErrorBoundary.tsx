import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../shared';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 'var(--space-xl)',
    backgroundColor: 'var(--color-bg-primary)',
    textAlign: 'center',
  },
  icon: {
    marginBottom: 'var(--space-lg)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--font-size-xl)',
    color: 'var(--color-error)',
    marginBottom: 'var(--space-md)',
  },
  message: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-lg)',
    maxWidth: '500px',
  },
  errorBox: {
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'left',
    overflow: 'auto',
    maxHeight: '200px',
  },
  errorText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-error)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.icon}>
            <AlertTriangle size={64} color="var(--color-error)" />
          </div>

          <h1 style={styles.title}>Something went wrong</h1>

          <p style={styles.message}>
            An unexpected error occurred. The application encountered a problem
            and couldn't continue. Try refreshing the page.
          </p>

          {this.state.error && (
            <div style={styles.errorBox}>
              <code style={styles.errorText}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </code>
            </div>
          )}

          <Button variant="primary" onClick={this.handleReset}>
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Refresh Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
