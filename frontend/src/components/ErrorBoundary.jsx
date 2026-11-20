import React from 'react';
import { AlertCircle, RefreshCw, Home, Copy, Check } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Workverse ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyDetails = () => {
    const details = `Workverse Error Diagnostic:
Error: ${this.state.error?.toString()}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}`;
    navigator.clipboard.writeText(details).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center p-6 text-[#171717]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2 font-display">
              Workspace Interrupted
            </h1>

            <p className="text-sm text-[#777777] mb-6 leading-relaxed">
              An unexpected interface error occurred. Your work is safe, and the issue has been captured in local diagnostics.
            </p>

            {this.state.error && (
              <div className="p-3 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-red-600 font-mono overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F36B21] text-white rounded-xl font-medium text-sm hover:bg-[#d95914] transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Workspace
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-[#171717] rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>

            <button
              onClick={this.handleCopyDetails}
              className="inline-flex items-center gap-1.5 text-xs text-[#777777] hover:text-[#171717] transition-colors cursor-pointer"
            >
              {this.state.copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied Diagnostic Info</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Diagnostic Info</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
