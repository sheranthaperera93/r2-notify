import React, { useState } from "react";
import { R2NotifyProvider, useNotifications } from "r2-notify-react";
import NotificationsDashboard from "./components/NotificationsDashboard";
import ConfigurationPanel from "./components/ConfigurationPanel";
import "./App.css";

interface AppContentProps {
  wsUrl: string;
  setWsUrl: (url: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
}

const AppContent: React.FC<AppContentProps> = ({
  wsUrl,
  setWsUrl,
  clientId,
  setClientId,
}) => {
  const { isConnected, lastError } = useNotifications();

  return (
    <div className="container">
      <div className="header">
        <h1>🔔 R2 Notify Test App</h1>
        <p>Test the r2-notify-react notification system</p>
      </div>

      {lastError && (
        <div className="error-message">
          <strong>Error:</strong> {lastError ? lastError.message : "Unknown"}
        </div>
      )}

      <div className="main-grid">
        <div className="card">
          <h2>Connection Settings</h2>
          <div className="status-badge" style={{ marginBottom: "16px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                marginRight: "8px",
                backgroundColor: isConnected ? "#10b981" : "#ef4444",
              }}
            ></span>
            {isConnected ? "Connected" : "Disconnected"}
          </div>

          <div className="form-group">
            <label>WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8080/ws"
            />
          </div>

          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Unique client identifier"
            />
          </div>

          <p
            style={{
              marginTop: "16px",
              fontSize: "0.9em",
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            <strong>Note:</strong> The WebSocket connection is established
            automatically when the provider is mounted with{" "}
            <code style={{ background: "#f0f0f0", padding: "2px 6px" }}>
              autoConnect=true
            </code>
            .
          </p>
        </div>

        <ConfigurationPanel />
      </div>

      <div className="card full-width">
        <NotificationsDashboard />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [wsUrl, setWsUrl] = useState("ws://localhost:8081/ws");
  const [clientId, setClientId] = useState(`client-1768563100345`);

  return (
    <R2NotifyProvider url={wsUrl} clientId={clientId} autoConnect={true} debug={true}>
      <AppContent
        wsUrl={wsUrl}
        clientId={clientId}
        setWsUrl={setWsUrl}
        setClientId={setClientId}
      />
    </R2NotifyProvider>
  );
};

export default App;
