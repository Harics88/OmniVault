import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        console.error('Error caught by boundary:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo
        });

        // TODO: Send error to logging service in production
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-background-card border border-border rounded-xl p-8 shadow-elevated">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-accent-red" />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-text-secondary text-center mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        {/* Error Details (Development Only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-background rounded-lg border border-border">
                                <h3 className="text-sm font-semibold text-text-primary mb-2">
                                    Error Details (Development Mode):
                                </h3>
                                <pre className="text-xs text-accent-red overflow-auto max-h-40 font-mono">
                                    {this.state.error.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                                            Component Stack
                                        </summary>
                                        <pre className="text-xs text-text-muted mt-2 overflow-auto max-h-40 font-mono">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary gap-2"
                            >
                                <RefreshCw size={18} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn btn-ghost gap-2 ring-1 ring-border"
                            >
                                <Home size={18} />
                                Go Home
                            </button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-text-muted text-center mt-6">
                            If this problem persists, try refreshing the page or clearing your browser cache.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
