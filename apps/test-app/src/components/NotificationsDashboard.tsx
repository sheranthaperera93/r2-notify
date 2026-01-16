import React from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";

interface Notification {
  id?: string;
  title?: string;
  body?: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
}

const NotificationsDashboard: React.FC = () => {
  const { listNotifications, newNotification } = useNotifications();
  const actions = useNotifyActions();

  const allNotifications = [
    ...(Array.isArray(listNotifications) ? listNotifications : []),
    ...(Array.isArray(newNotification) ? newNotification : []),
  ];

  const handleRefresh = () => {
    actions?.reloadNotifications?.();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2>📬 Notifications</h2>
        <button onClick={handleRefresh} style={{ flex: "0 0 auto" }}>
          🔄 Refresh
        </button>
      </div>

      {allNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No notifications yet</p>
          <p style={{ fontSize: "0.9em", marginTop: "8px", color: "#999" }}>
            Notifications will appear here when received from the server
          </p>
        </div>
      ) : (
        <div className="notification-list">
          {allNotifications.map((notification: Notification, index) => (
            <div
              key={`${notification.id}-${index}`}
              className="notification-item"
            >
              <div className="notification-item-title">
                {notification.title || "Notification"}
              </div>
              {(notification.body || notification.message) && (
                <div className="notification-item-body">
                  {notification.body || notification.message}
                </div>
              )}
              <div className="notification-item-timestamp">
                {formatDate(notification.createdAt || notification.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "16px",
          fontSize: "0.85em",
          color: "#999",
          textAlign: "center",
        }}
      >
        Total: {allNotifications.length} notification
        {allNotifications.length !== 1 ? "s" : ""}
      </div>
    </>
  );
};

export default NotificationsDashboard;
