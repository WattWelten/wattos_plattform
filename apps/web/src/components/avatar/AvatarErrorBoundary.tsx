'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary für Avatar-Komponenten
 * Fängt Fehler beim Laden von GLTF-Modellen ab
 */
export class AvatarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Avatar model loading error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI anzeigen
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center text-gray-500">
              <p className="text-sm">Avatar-Modell konnte nicht geladen werden</p>
              <p className="text-xs mt-1">Bitte stellen Sie sicher, dass das Modell vorhanden ist</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
