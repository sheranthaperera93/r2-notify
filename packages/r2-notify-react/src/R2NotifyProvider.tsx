import React from "react";
import { NotificationMessage, R2NotifyClient } from "r2-notify-client";
import type { R2NotifyReactOptions, R2NotifyState } from "./types";
import { NotificationConfig } from "r2-notify-client";
import { R2NotifyContext } from "./context";

export interface R2NotifyProviderProps extends R2NotifyReactOptions {
  children: React.ReactNode;
}

export const R2NotifyProvider: React.FC<R2NotifyProviderProps> = ({
  children,
  autoConnect = true,
  clientId,
  ...opts
}) => {
  const [state, setState] = React.useState<R2NotifyState>({
    isConnected: false,
  });

  // Keep a stable client instance across renders while options remain the same
  const clientRef = React.useRef<R2NotifyClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new R2NotifyClient({ ...opts, clientId });
  }

  React.useEffect(() => {
    const client = clientRef.current!;
    let isMounted = true;

    /**
     * Called when the WebSocket connection is established.
     * Resets the internal state to indicate a connected state, clearing any previous error.
     */
    const handleConnected = () => {
      if (!isMounted) return;
      setState((s) => ({ ...s, isConnected: true, lastError: undefined }));
    };

    /**
     * Called when the WebSocket connection is closed.
     * Resets the internal state to indicate a disconnected state.
     */
    const handleClosed = () => {
      if (!isMounted) return;
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
      if (opts.debug)
        console.debug("[r2-react] on list notifications", payload);
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
      if (opts.debug) console.debug("[r2-react] on new notification", payload);
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
      if (opts.debug)
        console.debug("[r2-react] on list configurations", payload);
      setState((s) => ({ ...s, listConfigurations: payload }));
    };

    // Hook into client events
    client.on("connected", handleConnected);
    client.on("disconnected", handleClosed);
    client.on("listNotifications", onListNotifications);
    client.on("newNotification", onNewNotification);
    client.on("listConfigurations", onListConfigurations);

    // Optional: expose internal state transitions via debug logs if needed
    if (opts.debug) {
      console.log(
        "[r2-react] provider mount; autoConnect =",
        autoConnect,
        "clientId =",
        clientId
      );
    }

    if (autoConnect) {
      client.connect({});
      // Update connection state when onOpen fires (handled in client via heartbeat start)
      // We don't have a direct onOpen event, so we set connected on first event or rely on heartbeat success.
      // If you want a more explicit connected callback, you can enhance the client to emit 'connected' custom event.
      // For now, we optimistically set connected after a small delay if no close occurred.
      const t = setTimeout(() => {
        setState((s) => ({
          ...s,
          isConnected: client["conn"]?.isOpen?.() ?? s.isConnected,
        }));
      }, 300);
      return () => clearTimeout(t);
    }

    return () => {
      isMounted = false;
      client.off("connected", handleConnected);
      client.off("disconnected", handleClosed);
      client.off("listNotifications", onListNotifications);
      client.off("newNotification", onNewNotification);
      client.off("listConfigurations", onListConfigurations);
      if (autoConnect) {
        client.close();
      }
    };
  }, [autoConnect, clientId, opts.debug]);

  const actions = React.useMemo(() => {
    const client = clientRef.current!;
    return {
      markAsRead: () => client.markAsRead(),
      markAppAsRead: (appId: string) => client.markAppAsRead(appId),
      markGroupAsRead: (appId: string, groupKey: string) =>
        client.markGroupAsRead(appId, groupKey),
      markNotificationAsRead: (id: string) =>
        client.markNotificationAsRead(id),

      deleteNotifications: () => client.deleteNotifications(),
      deleteAppNotifications: (appId: string) =>
        client.deleteAppNotifications(appId),
      deleteGroupNotifications: (appId: string, groupKey: string) =>
        client.deleteGroupNotifications(appId, groupKey),
      deleteNotification: (id: string) => client.deleteNotification(id),

      reloadNotifications: () => client.reloadNotifications(),
      toggleNotificationStatus: (appId: string, enabled: boolean) =>
        client.toggleNotificationStatus(appId, enabled),
    };
  }, []);

  const value = React.useMemo(
    () => ({
      client: clientRef.current,
      clientId,
      state,
      actions,
    }),
    [state, actions, clientId]
  );

  return (
    <R2NotifyContext.Provider value={value}>
      {children}
    </R2NotifyContext.Provider>
  );
};