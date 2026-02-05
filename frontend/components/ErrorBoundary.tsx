'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-red-50 dark:bg-red-950'>
          <div className='mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900'>
            <h1 className='text-2xl font-bold text-red-600 dark:text-red-400 mb-4'>
              Something went wrong
            </h1>
            <p className='text-gray-700 dark:text-gray-300 mb-6'>
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-6'>
                <summary className='cursor-pointer text-sm text-gray-600 dark:text-gray-400'>
                  Error details
                </summary>
                <pre className='mt-2 overflow-auto bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs text-gray-800 dark:text-gray-200'>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className='w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition'
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
