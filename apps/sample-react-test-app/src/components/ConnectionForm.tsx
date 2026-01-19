export default function ConnectionForm({
  wsUrl,
  setWsUrl,
  clientId,
  setClientId,
  isConnected,
}: {
  wsUrl: string;
  setWsUrl: (url: string) => void;
  clientId: string;
  setClientId: (clientId: string) => void;
  isConnected: boolean;
}) {
  return (
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
  );
}
