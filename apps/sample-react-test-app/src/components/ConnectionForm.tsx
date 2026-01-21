import { Card, TextField, Typography } from "@mui/material";
import { useNotifications } from "r2-notify-react";
import { CardTitle, Row } from "react-bootstrap";

export default function ConnectionForm({
  wsUrl,
  setWsUrl,
  clientId,
  setClientId,
}: {
  wsUrl: string;
  setWsUrl: (url: string) => void;
  clientId: string;
  setClientId: (clientId: string) => void;
}) {
  const { isConnected } = useNotifications();
  return (
    <Card className="card">
      <CardTitle>
        <Typography variant="h6">🔗 Connection Settings</Typography>
      </CardTitle>

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
      <Row>
        <TextField
          id="websocket_url_field"
          label="WebSocket URL"
          variant="outlined"
          fullWidth
          margin="normal"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          placeholder="Unique client identifier"
        />
      </Row>
      <Row>
        <TextField
          id="user_id_field"
          label="User ID"
          variant="outlined"
          fullWidth
          margin="normal"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Unique client identifier"
        />
      </Row>
      <Typography
        variant="caption"
        color="#666"
        marginTop="16px"
        fontSize="0.9em"
        lineHeight="1.6"
      >
        <strong>Note:</strong> The WebSocket connection is established
        automatically when the provider is mounted with{" "}
        <code style={{ background: "#f0f0f0", padding: "2px 6px" }}>
          autoConnect=true
        </code>
        .
      </Typography>
    </Card>
  );
}
