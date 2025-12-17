"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultFallback;
      return <Fallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <p className="text-white/80 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-xl border border-amber-400/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  );
}
