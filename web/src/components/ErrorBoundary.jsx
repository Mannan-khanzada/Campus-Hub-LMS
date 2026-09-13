import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("CampusHub crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#FAF9F4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 560, background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
            <h2 style={{ color: "#B7434A", marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: "#5B6478", fontSize: 14 }}>
              Please copy the error below and share it so it can be fixed:
            </p>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#FAF9F4", padding: 12, borderRadius: 8, color: "#16213E" }}>
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, background: "#16213E", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
