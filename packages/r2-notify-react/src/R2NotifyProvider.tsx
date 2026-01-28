import React from "react";
import { NotificationConfig, NotificationMessage, R2NotifyClient } from "r2-notify-client";
import type { R2NotifyReactOptions, R2NotifyState } from "./types";
import { R2NotifyContext } from "./context";

export interface R2NotifyProviderProps extends R2NotifyReactOptions {
  children: React.ReactNode;
}

export const R2NotifyProvider: React.FC<R2NotifyProviderProps> = ({ children, autoConnect = true, clientId, url, debug = false, ...opts }) => {
  const [state, setState] = React.useState<R2NotifyState>({
    isConnected: false,
  });

  // Keep a stable client instance across renders while options remain the same
  const clientRef = React.useRef<R2NotifyClient | null>(null);

  // Track when client is recreated to trigger actions re-memoization
  const [clientVersion, setClientVersion] = React.useState(0);

  React.useEffect(() => {
    // Clean up existing client
    if (clientRef.current) {
      if (debug) {
        console.log("[r2-react] Cleaning up old client");
      }
      clientRef.current.close();
      clientRef.current = null;
    }

    // Only create new client if we have a clientId
    if (!clientId) {
      setState({ isConnected: false });
      return;
    }

    // Create new client with current props
    if (debug) {
      console.log("[r2-react] Creating new client with clientId =", clientId);
    }
    const client = new R2NotifyClient({ ...opts, url, debug, clientId });
    clientRef.current = client;

    // Increment version to trigger actions re-memoization
    setClientVersion((v) => v + 1);

    let isMounted = true;

    /**
     * Called when the WebSocket connection is established.
     * Resets the internal state to indicate a connected state, clearing any previous error.
     */
    const handleConnected = () => {
      if (!isMounted) return;
      if (debug) console.log("[r2-react] ✅ handleConnected");
      setState((s) => ({ ...s, isConnected: true, lastError: undefined }));
    };

    /**
     * Called when the WebSocket connection is closed.
     * Resets the internal state to indicate a disconnected state.
     */
    const handleClosed = () => {
      if (!isMounted) return;
      if (debug) console.log("[r2-react] ❌ handleClosed");
      setState((s) => ({ ...s, isConnected: false }));
    };

    /**
     * Called when the client receives a list of notifications from the server.
     * Sets the internal state with the received list of notifications.
     * If the received payload is not an array, it is ignored.
     * @param {NotificationMessage[]} payload - The list of notifications received from the server.
     */
    const onListNotifications = (payload: NotificationMessage[]) => {
      if (!isMounted) return;
      if (debug) console.debug("[r2-react] 📋 on list notifications", payload);
      setState((s) => ({ ...s, listNotifications: payload }));
    };

    /**
     * Called when the client receives a new notification from the server.
     * Sets the internal state with the received notification.
     * If the received payload is not a valid notification (i.e., it lacks an ID), it is ignored.
     * @param {NotificationMessage} payload - The new notification received from the server.
     */
    const onNewNotification = (payload: NotificationMessage) => {
      if (!isMounted) return;
      if (debug) console.debug("[r2-react] 🔔 on new notification", payload);
      if (!payload.id) return;
      setState((s) => ({ ...s, newNotification: payload }));
    };

    /**
     * Called when the client receives a list of configurations from the server.
     * Sets the internal state with the received list of configurations.
     * If the received payload is not a valid configuration (i.e., it lacks an ID), it is ignored.
     * @param {NotificationConfig} payload - The list of configurations received from the server.
     */
    const onListConfigurations = (payload: NotificationConfig) => {
      if (!isMounted) return;
      if (debug) console.debug("[r2-react] ⚙️ on list configurations", payload);
      setState((s) => ({ ...s, listConfigurations: payload }));
    };

    // Hook into client events
    client.on("connected", handleConnected);
    client.on("disconnected", handleClosed);
    client.on("listNotifications", onListNotifications);
    client.on("newNotification", onNewNotification);
    client.on("listConfigurations", onListConfigurations);

    // Optional: expose internal state transitions via debug logs if needed
    if (debug) {
      console.log("[r2-react] 🔧 provider mount; autoConnect:", autoConnect, "clientId:", clientId);
    }

    if (autoConnect) {
      if (debug) console.log("[r2-react] 🚀 Auto-connecting...");
      client.connect({});
      const t = setTimeout(() => {
        if (isMounted) {
          const isOpen = client["conn"]?.isOpen?.() ?? false;
          if (debug) {
            console.log("[r2-react] 📊 Connection check after 300ms - isOpen:", isOpen);
          }
          setState((s) => ({
            ...s,
            isConnected: isOpen || s.isConnected,
          }));
        }
      }, 300);
      return () => {
        if (debug) console.log("[r2-react] 🧹 Cleanup - unmounting (autoConnect)");
        clearTimeout(t);
        isMounted = false;
        client.off("connected", handleConnected);
        client.off("disconnected", handleClosed);
        client.off("listNotifications", onListNotifications);
        client.off("newNotification", onNewNotification);
        client.off("listConfigurations", onListConfigurations);
        client.close();
      };
    } else {
      // We’ve just (re)created a client that is not connected
      setState((s) => ({ ...s, isConnected: false }));
    }

    return () => {
      if (debug) console.log("[r2-react] 🧹 Cleanup - unmounting (manual)");
      isMounted = false;
      client.off("connected", handleConnected);
      client.off("disconnected", handleClosed);
      client.off("listNotifications", onListNotifications);
      client.off("newNotification", onNewNotification);
      client.off("listConfigurations", onListConfigurations);
      client.close();
    };
  }, [autoConnect, clientId, debug, url]);

  const actions = React.useMemo(() => {
    const client = clientRef.current;

    if (!client) {
      if (debug) console.warn("[r2-react] ⚠️ Actions created but client is null");
      return {
        connect: () => console.warn("[r2-react] Client not ready"),
        disconnect: () => console.warn("[r2-react] Client not ready"),
        markAsRead: () => console.warn("[r2-react] Client not ready"),
        markAppAsRead: () => console.warn("[r2-react] Client not ready"),
        markGroupAsRead: () => console.warn("[r2-react] Client not ready"),
        markNotificationAsRead: () => console.warn("[r2-react] Client not ready"),
        deleteNotifications: () => console.warn("[r2-react] Client not ready"),
        deleteAppNotifications: () => console.warn("[r2-react] Client not ready"),
        deleteGroupNotifications: () => console.warn("[r2-react] Client not ready"),
        deleteNotification: () => console.warn("[r2-react] Client not ready"),
        reloadNotifications: () => console.warn("[r2-react] Client not ready"),
        setNotificationStatus: () => console.warn("[r2-react] Client not ready"),
      };
    }

    return {
      connect: () => {
        if (debug) console.log("[r2-react] 🚀 Manual connect called");
        client.connect({});
      },
      disconnect: () => {
        if (debug) console.log("[r2-react] 🛑 Manual disconnect called");
        try {
          client.close();
        } finally {
          // Ensure UI reflects disconnection even if there was no open socket
          setState((s) => ({ ...s, isConnected: false }));
        }
      },
      markAsRead: () => client.markAsRead(),
      markAppAsRead: (appId: string) => client.markAppAsRead(appId),
      markGroupAsRead: (appId: string, groupKey: string) => client.markGroupAsRead(appId, groupKey),
      markNotificationAsRead: (id: string) => client.markNotificationAsRead(id),

      deleteNotifications: () => client.deleteNotifications(),
      deleteAppNotifications: (appId: string) => client.deleteAppNotifications(appId),
      deleteGroupNotifications: (appId: string, groupKey: string) => client.deleteGroupNotifications(appId, groupKey),
      deleteNotification: (id: string) => client.deleteNotification(id),

      reloadNotifications: () => client.reloadNotifications(),
      setNotificationStatus: (enableNotification: boolean) => client.setNotificationStatus(enableNotification),
    };
  }, [clientVersion, debug]); // Re-memoize when client is recreated

  const value = React.useMemo(
    () => ({
      client: clientRef.current,
      clientId,
      state,
      actions,
    }),
    [state, actions, clientId],
  );

  return <R2NotifyContext.Provider value={value}>{children}</R2NotifyContext.Provider>;
};
