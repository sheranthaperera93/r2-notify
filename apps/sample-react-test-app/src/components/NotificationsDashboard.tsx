import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNotifications, useNotifyActions } from "r2-notify-react";

interface NotificationMessage {
  id: string;
  appId: string;
  userId: string;
  groupKey: string;
  message: string;
  status: "success" | "error" | "warning" | "info";
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

function parseTime(s?: string) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

const NotificationsDashboard: React.FC = () => {
  const { listNotifications, newNotification } = useNotifications();
  const actions = useNotifyActions();

  const [incr, setIncr] = useState<NotificationMessage[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const base = Array.isArray(listNotifications) ? listNotifications : [];
    const nextSeen = new Set<string>();
    for (const n of base) nextSeen.add(n.id);
    seen.current = nextSeen;

    // Remove increments that the base already contains
    setIncr((curr) => curr.filter((n) => !nextSeen.has(n.id)));
  }, [listNotifications]);

  // Each new increment: add to local accumulator if not seen
  useEffect(() => {
    if (!newNotification) return;
    const n = newNotification as NotificationMessage;
    if (!n.id) return; // defensive

    if (seen.current.has(n.id)) return; // duplicate → ignore
    seen.current.add(n.id);
    // Prepend so newest appears first (optional)
    setIncr((curr) => [n, ...curr]);
  }, [newNotification]);

  const allNotifications = useMemo(() => {
    const base = Array.isArray(listNotifications) ? listNotifications : [];

    const merged = [...incr, ...base];

    const byId = new Map<string, NotificationMessage>();
    for (const n of merged) {
      const existing = byId.get(n.id);
      if (!existing) {
        byId.set(n.id, n);
      } else {
        // Prefer newer by createdAt/updatedAt
        const te = Math.max(
          parseTime(existing.createdAt),
          parseTime(existing.updatedAt)
        );
        const tn = Math.max(parseTime(n.createdAt), parseTime(n.updatedAt));
        if (tn >= te) byId.set(n.id, n);
      }
    }

    const result = Array.from(byId.values());
    result.sort((a, b) => {
      const ta = Math.max(parseTime(a.createdAt), parseTime(a.updatedAt));
      const tb = Math.max(parseTime(b.createdAt), parseTime(b.updatedAt));
      return tb - ta;
    });

    return result;
  }, [listNotifications, incr]);

  // 2) group: App -> Group -> Items (with latest ts + unread counts)
  type GroupUI = {
    groupKey: string;
    latest: number;
    unread: number;
    items: NotificationMessage[];
  };
  type AppUI = {
    appId: string;
    latest: number;
    unread: number;
    groups: GroupUI[];
    total: number;
  };

  const grouped = useMemo<AppUI[]>(() => {
    const apps = new Map<
      string,
      {
        latest: number;
        unread: number;
        total: number;
        groups: Map<string, GroupUI>;
      }
    >();

    for (const n of allNotifications) {
      const t = Math.max(parseTime(n.createdAt), parseTime(n.updatedAt));
      const app = apps.get(n.appId) ?? {
        latest: 0,
        unread: 0,
        total: 0,
        groups: new Map<string, GroupUI>(),
      };

      const grp = app.groups.get(n.groupKey) ?? {
        groupKey: n.groupKey,
        latest: 0,
        unread: 0,
        items: [] as NotificationMessage[],
      };

      grp.items.push(n);
      grp.latest = Math.max(grp.latest, t);
      if (!n.readStatus) grp.unread += 1;

      app.groups.set(n.groupKey, grp);
      app.latest = Math.max(app.latest, t);
      app.unread += n.readStatus ? 0 : 1;
      app.total += 1;

      apps.set(n.appId, app);
    }

    // finalize: sort groups (by latest desc) and apps (by latest desc)
    const appArr: AppUI[] = Array.from(apps, ([appId, data]) => {
      const groups = Array.from(data.groups.values()).map((g) => {
        // sort items newest-first inside each group
        g.items.sort((a, b) => {
          const ta = Math.max(parseTime(a.createdAt), parseTime(a.updatedAt));
          const tb = Math.max(parseTime(b.createdAt), parseTime(b.updatedAt));
          return tb - ta;
        });
        return g;
      });
      groups.sort((a, b) => b.latest - a.latest);

      return {
        appId,
        latest: data.latest,
        unread: data.unread,
        total: data.total,
        groups,
      };
    });

    appArr.sort((a, b) => b.latest - a.latest);
    return appArr;
  }, [allNotifications]);

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
          Reload Notifications
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No notifications yet</p>
          <p style={{ fontSize: "0.9em", marginTop: 8, color: "#999" }}>
            Notifications will appear here when received from the server
          </p>
        </div>
      ) : (
        <div className="notifications-root">
          {grouped.map((app) => (
            <section
              key={app.appId}
              className="app-block"
              style={{ marginBottom: 20 }}
            >
              <div
                className="app-header"
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <h3 style={{ margin: 0 }}>{app.appId}</h3>
                <span style={{ color: "#777", fontSize: 12 }}>
                  {app.unread} unread • {app.total} total
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button onClick={() => actions?.markAppAsRead?.(app.appId)}>
                    Mark App as Read
                  </button>
                  <button onClick={() => actions?.deleteAppNotifications?.(app.appId)}>
                    Delete App
                  </button>
                </div>
              </div>

              {app.groups.map((g) => (
                <details
                  key={`${app.appId}::${g.groupKey}`}
                  open
                  style={{
                    background: "#fafafa",
                    borderRadius: 6,
                    marginTop: 12,
                    padding: 8,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      listStyle: "none",
                    }}
                  >
                    <strong>{g.groupKey}</strong>
                    <span style={{ color: "#777", fontSize: 12 }}>
                      {g.unread} unread • {g.items.length} items
                    </span>
                    <div
                      style={{ marginLeft: "auto", display: "flex", gap: 8 }}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          actions?.markGroupAsRead?.(app.appId, g.groupKey);
                        }}
                      >
                        Mark Group as Read
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          actions?.deleteGroupNotifications?.(app.appId, g.groupKey);
                        }}
                      >
                        Delete Group
                      </button>
                    </div>
                  </summary>

                  <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    {g.items.map((n) => (
                      <li
                        key={n.id}
                        style={{
                          listStyle: "none",
                          borderBottom: "1px solid #eee",
                          padding: "8px 0",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          opacity: n.readStatus ? 0.7 : 1,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          {n.message && (
                            <div style={{ marginTop: 4 }}>{n.message}</div>
                          )}
                          <div
                            style={{
                              color: "#777",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {formatDate(n.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          {!n.readStatus && (
                            <button
                              onClick={() =>
                                actions?.markNotificationAsRead?.(n.id)
                              }
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={() => actions?.deleteNotification?.(n.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </section>
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
