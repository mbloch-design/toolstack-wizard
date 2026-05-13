import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches render/lifecycle errors that would
 * otherwise white-screen the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);

    // Chunk loading errors happen after a new deployment invalidates old Vite chunks.
    // Auto-reload once to fetch the fresh bundle — avoids a blank error screen.
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      const reloadKey = "chunk_reload_attempted";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive text-2xl">
            ⚠
          </div>
          <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {this.state.error?.message?.includes("dynamically imported module")
              ? "La page a été mise à jour. Rechargez pour continuer."
              : (this.state.error?.message ?? "Erreur inattendue. Rechargez la page.")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
