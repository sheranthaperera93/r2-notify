import React, { useState } from "react";
import { R2NotifyProvider, useNotifications } from "r2-notify-react";
import NotificationsDashboard from "./components/NotificationsDashboard";
import ConfigurationPanel from "./components/ConfigurationPanel";
import "./App.css";
import ConnectionForm from "./components/ConnectionForm";

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
        {/* Connection Form */}
        <ConnectionForm
          clientId={clientId}
          isConnected={isConnected}
          setClientId={setClientId}
          setWsUrl={setWsUrl}
          wsUrl={wsUrl}
        />

        {/* Configuration Panel */}
        <ConfigurationPanel />
      </div>

      <div className="card full-width">
        {/* Notifications Dashboard */}
        <NotificationsDashboard />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [wsUrl, setWsUrl] = useState("ws://localhost:8081/ws");
  const [clientId, setClientId] = useState(`client-1768563100345`);

  return (
    <R2NotifyProvider
      url={wsUrl}
      clientId={clientId}
      autoConnect={true}
      debug={true}
    >
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
