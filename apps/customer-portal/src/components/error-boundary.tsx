'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppleCard, AppleButton } from '@wattweiser/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <AppleCard padding="lg" className="max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Ein Fehler ist aufgetreten
            </h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            <div className="flex gap-4">
              <AppleButton
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Seite neu laden
              </AppleButton>
              <AppleButton
                variant="outline"
                onClick={() => {
                  window.location.href = '/overview';
                }}
              >
                Zur Startseite
              </AppleButton>
            </div>
          </AppleCard>
        </div>
      );
    }

    return this.props.children;
  }
}


