import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FCF8F5] text-[#231D1A] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#EADCD6] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#231D1A]">
              Something interrupted your planning session
            </h2>
            <p className="text-sm text-[#6E605A] leading-relaxed">
              We caught a workspace error so your unsaved inputs stay protected. You can reload to reconnect cleanly.
            </p>
            <div className="bg-[#FFF3EE] border border-[#EADCD6] rounded-lg p-3 text-xs font-mono-num text-[#6E605A] break-words">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#E25845] hover:bg-[#C84432] rounded-lg transition-colors"
            >
              Reload Planner
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
