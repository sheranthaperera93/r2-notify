import React, { useState } from "react";
import { useNotifications } from "r2-notify-react";

interface Configuration {
  [key: string]: any;
}

const ConfigurationPanel: React.FC = () => {
  const { listConfigurations: configuration } = useNotifications();
  const [showDetails, setShowDetails] = useState(false);

  const configList = configuration ? (configuration as Configuration) : {};
  const configEntries = Object.entries(configList);

  return (
    <div className="card">
      <h2>⚙️ Configuration</h2>

      {configEntries.length === 0 ? (
        <div className="empty-state" style={{ padding: "16px" }}>
          <p>No configuration loaded</p>
          <p style={{ fontSize: "0.9em", marginTop: "8px", color: "#999" }}>
            Click "Load Configuration" to fetch from server
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#f0f4ff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#667eea",
                marginBottom: "8px",
              }}
            >
              Configurations ({configEntries.length})
            </div>

            {configEntries.slice(0, 3).map(([key, value], idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    padding: "8px",
                    background: "white",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                  }}
                >
                  <div style={{ color: "#666" }}>
                    <strong>{key}:</strong> {String(value).slice(0, 30)}
                    {String(value).length > 30 ? "..." : ""}
                  </div>
                </div>
              </div>
            ))}

            {configEntries.length > 3 && (
              <div
                style={{
                  fontSize: "0.85em",
                  color: "#999",
                  marginTop: "8px",
                  textAlign: "center",
                }}
              >
                +{configEntries.length - 3} more configuration
                {configEntries.length - 3 !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: showDetails ? "#764ba2" : "#667eea",
              marginBottom: "12px",
            }}
          >
            {showDetails ? "Hide Details" : "Show Raw Data"}
          </button>

          {showDetails && (
            <pre
              style={{
                background: "#f9fafb",
                padding: "12px",
                borderRadius: "8px",
                overflow: "auto",
                maxHeight: "300px",
                fontSize: "0.8em",
                border: "1px solid #e5e7eb",
              }}
            >
              {JSON.stringify(configList, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
};

export default ConfigurationPanel;