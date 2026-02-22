import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 text-center">
            <h1 className="text-xl font-semibold">Ocorreu um erro inesperado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualize a pagina para tentar novamente.
            </p>
            <Button className="mt-4" onClick={this.handleReload}>
              Recarregar pagina
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
