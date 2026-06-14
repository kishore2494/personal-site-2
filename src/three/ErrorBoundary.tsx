import { Component, type ReactNode } from "react";

/** Minimal error boundary so a failed asset (e.g. the GLTF) falls back gracefully. */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
