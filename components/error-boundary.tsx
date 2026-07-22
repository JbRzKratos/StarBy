'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="fixed inset-0 z-[9999] bg-charcoal text-red-500 p-8 flex flex-col items-center justify-center font-mono">
          <h2 className="text-xl mb-4 font-bold">Client-Side Error Caught</h2>
          <pre className="bg-graphite p-4 rounded text-sm overflow-auto max-w-full text-pearl border border-red-500">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <div className="mt-4 text-xs text-ash max-w-full overflow-auto">
            {this.state.error?.stack}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 bg-cobalt text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
