import React, { useState } from "react";
import { R2NotifyProvider, useNotifications } from "r2-notify-react";
import "./App.css";
import ConnectionForm from "./components/ConnectionForm";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import NotificationPanel from "./components/notifications/NotificationPanel";

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
  const { lastError } = useNotifications();

  return (
    <div className="container">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="success">
          <Toolbar>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              R2 Notify Test App
            </Typography>
            <NotificationPanel />
          </Toolbar>
        </AppBar>
      </Box>
      <Typography
        variant="h5"
        marginTop="10px"
        marginLeft="20px"
        marginRight="20px"
      >
        Test the r2-notify-react notification system
      </Typography>

      {lastError && (
        <Typography variant="h5" className="error-message" marginTop="15px">
          <strong>Error:</strong> {lastError ? lastError.message : "Unknown"}
        </Typography>
      )}

      <Box
        sx={{
          flexGrow: 1,
          marginTop: "16px",
          marginLeft: "20px",
          marginRight: "20px",
        }}
      >
        <div className="main-grid">
          {/* Connection Form */}
          <ConnectionForm
            clientId={clientId}
            setClientId={setClientId}
            setWsUrl={setWsUrl}
            wsUrl={wsUrl}
          />
        </div>
      </Box>
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
