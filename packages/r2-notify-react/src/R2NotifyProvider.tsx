import React from "react";
import { NotificationConfig, NotificationMessage, R2NotifyClient } from "r2-notify-client";
import type { R2NotifyReactOptions, R2NotifyState } from "./types";
import { R2NotifyContext } from "./context";

export interface R2NotifyProviderProps extends R2NotifyReactOptions {
  children: React.ReactNode;
}

export const R2NotifyProvider: React.FC<R2NotifyProviderProps> = ({ children, autoConnect = true, url, debug = false, ...opts }) => {
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
      if (debug) console.log("[r2-react] Cleaning up old client");
      clientRef.current.close();
      clientRef.current = null;
    }

    // Only create new client if required options are present
    if (!opts.token) {
      setState({ isConnected: false });
      return;
    }

    if (debug) console.log("[r2-react] Creating new client with token");

    const client = new R2NotifyClient({ ...opts, url, debug });
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
      if (debug) console.log("[r2-react] handleConnected");
      setState((s) => ({ ...s, isConnected: true, lastError: undefined }));
    };

    /**
     * Called when the WebSocket connection is closed.
     * Resets the internal state to indicate a disconnected state.
     */
    const handleDisconnected = () => {
      if (!isMounted) return;
      if (debug) console.log("[r2-react] handleDisconnected");
      setState((s) => ({ ...s, isConnected: false }));
    };

    /**
     * Called when the client receives a list of notifications from the server.
     */
    const handleListNotifications = (payload: unknown) => {
      if (!isMounted) return;
      const notifications = payload as NotificationMessage[];
      if (debug) console.debug("[r2-react] on list notifications", notifications);
      setState((s) => ({ ...s, listNotifications: notifications }));
    };

    /**
     * Called when the client receives a new notification from the server.
     * Ignores payloads that lack an ID.
     */
    const handleNewNotification = (payload: unknown) => {
      if (!isMounted) return;
      const notification = payload as NotificationMessage;
      if (debug) console.debug("[r2-react] on new notification", notification);
      if (!notification.id) return;
      setState((s) => ({ ...s, newNotification: notification }));
    };

    /**
     * Called when the client receives a list of configurations from the server.
     */
    const handleListConfigurations = (payload: unknown) => {
      if (!isMounted) return;
      const config = payload as NotificationConfig;
      if (debug) console.debug("[r2-react] on list configurations", config);
      setState((s) => ({ ...s, listConfigurations: config }));
    };

    /**
     * Called when an error occurs with the WebSocket connection.
     */
    const handleError = (payload: unknown) => {
      if (!isMounted) return;
      const error = payload instanceof Error ? payload : new Error("Connection error occurred");
      if (debug) console.error("[r2-react] handleError", error);
      setState((s) => ({ ...s, isConnected: false, lastError: error }));
    };

    // Register event handlers directly on the client
    // Note: client.connect() is called with no handlers to avoid double-registration
    client.on("connected", handleConnected);
    client.on("disconnected", handleDisconnected);
    client.on("error", handleError);
    client.on("listNotifications", handleListNotifications);
    client.on("newNotification", handleNewNotification);
    client.on("listConfigurations", handleListConfigurations);

    if (debug) {
      console.log("[r2-react] provider mount; autoConnect:", autoConnect, "token:", "" + opts.token?.slice(0, 4) + "...");
    }

    const cleanup = () => {
      isMounted = false;
      client.off("connected", handleConnected);
      client.off("disconnected", handleDisconnected);
      client.off("error", handleError);
      client.off("listNotifications", handleListNotifications);
      client.off("newNotification", handleNewNotification);
      client.off("listConfigurations", handleListConfigurations);
      client.close();
    };

    if (autoConnect) {
      if (debug) console.log("[r2-react] Auto-connecting...");
      client.connect();
      return () => {
        if (debug) console.log("[r2-react] Cleanup - unmounting (autoConnect)");
        cleanup();
      };
    } else {
      setState((s) => ({ ...s, isConnected: false }));
      return () => {
        if (debug) console.log("[r2-react] Cleanup - unmounting (manual)");
        cleanup();
      };
    }
  }, [autoConnect, opts.token, debug, url]);

  const actions = React.useMemo(() => {
    const client = clientRef.current;

    if (!client) {
      if (debug) console.warn("[r2-react] Actions created but client is null");
      return {
        markAsRead: () => console.warn("[r2-react] Client not ready"),
        markAppAsRead: (_appId: string) => console.warn("[r2-react] Client not ready"),
        markGroupAsRead: (_appId: string, _groupKey: string) => console.warn("[r2-react] Client not ready"),
        markNotificationAsRead: (_id: string) => console.warn("[r2-react] Client not ready"),
        deleteNotifications: () => console.warn("[r2-react] Client not ready"),
        deleteAppNotifications: (_appId: string) => console.warn("[r2-react] Client not ready"),
        deleteGroupNotifications: (_appId: string, _groupKey: string) => console.warn("[r2-react] Client not ready"),
        deleteNotification: (_id: string) => console.warn("[r2-react] Client not ready"),
        reloadNotifications: () => console.warn("[r2-react] Client not ready"),
        setNotificationStatus: (_enableNotification: boolean) => console.warn("[r2-react] Client not ready"),
      };
    }

    return {
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
  }, [clientVersion, debug]);

  const value = React.useMemo(
    () => ({
      client: clientRef.current,
      token: opts.token,
      state,
      actions,
    }),
    [state, actions, opts.token],
  );

  return <R2NotifyContext.Provider value={value}>{children}</R2NotifyContext.Provider>;
};
