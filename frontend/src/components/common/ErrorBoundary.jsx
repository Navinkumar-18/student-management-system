import { Component } from 'react';
import Icon from './Icon';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <Icon name="error" size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-on-surface">Something went wrong</h1>
            <p className="text-on-surface-variant mb-4">
              {this.props.fallback || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="bg-surface-container p-4 rounded-lg text-left text-sm mb-4 overflow-auto max-h-32 text-error">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-outline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
