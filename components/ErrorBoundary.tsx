import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary: Catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column' as const,
                    padding: '2rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    borderRadius: '12px',
                    margin: '1rem',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#f87171' }}>
                        Something went wrong
                    </h2>
                    <p style={{ margin: '0 0 1rem', color: '#94a3b8', textAlign: 'center' as const, maxWidth: '400px' }}>
                        This section encountered an error. Try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
