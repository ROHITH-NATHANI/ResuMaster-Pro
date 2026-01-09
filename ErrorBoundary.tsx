import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
                    <h1 style={{ color: '#e11d48' }}>Something went wrong.</h1>
                    <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}>{this.state.error?.toString()}</h3>
                        <pre style={{ margin: 0 }}>{this.state.errorInfo?.componentStack}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
