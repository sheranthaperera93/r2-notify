
import React from "react";
import { R2NotifyClient } from "r2-notify-client";
import type { R2NotifyReactOptions, R2NotifyState } from "./types";
import { R2NotifyContext } from "./context";

export interface R2NotifyProviderProps extends R2NotifyReactOptions {
  children: React.ReactNode;
}

export const R2NotifyProvider: React.FC<R2NotifyProviderProps> = ({
  children,
  autoConnect = true,
  ...opts
}) => {
  const [state, setState] = React.useState<R2NotifyState>({ isConnected: false });

  // Keep a stable client instance across renders while options remain the same
  const clientRef = React.useRef<R2NotifyClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new R2NotifyClient(opts);
  }

  React.useEffect(() => {
    const client = clientRef.current!;
    let isMounted = true;

    const handleConnected = () => {
      if (!isMounted) return;
      setState((s) => ({ ...s, isConnected: true, lastError: undefined }));
    };
    const handleClosed = () => {
      if (!isMounted) return;
      setState((s) => ({ ...s, isConnected: false }));
    };

    const onNotificationList = (payload: unknown) => {
      setState((s) => ({ ...s, notificationList: payload as any }));
    };
    const onNewNotificationList = (payload: unknown) => {
      setState((s) => ({ ...s, newNotificationList: payload as any }));
    };
    const onConfig = (payload: unknown) => {
      setState((s) => ({ ...s, notificationListConfiguration: payload as any }));
    };

    // Hook into client events
    client.on("listNotifications", onNotificationList);
    client.on("newNotification", onNewNotificationList);
    client.on("listConfigurations", onConfig);

    // Optional: expose internal state transitions via debug logs if needed
    if (opts.debug) {
      console.log("[r2-react] provider mount; autoConnect =", autoConnect);
    }

    if (autoConnect) {
      client.connect({ });
      // Update connection state when onOpen fires (handled in client via heartbeat start)
      // We don't have a direct onOpen event, so we set connected on first event or rely on heartbeat success.
      // If you want a more explicit connected callback, you can enhance the client to emit 'connected' custom event.
      // For now, we optimistically set connected after a small delay if no close occurred.
      const t = setTimeout(() => {
        setState((s) => ({ ...s, isConnected: client["conn"]?.isOpen?.() ?? true }));
      }, 300);
      return () => clearTimeout(t);
    }

    return () => {
      isMounted = false;
      client.off("listNotifications", onNotificationList);
      client.off("newNotification", onNewNotificationList);
      client.off("listConfigurations", onConfig);
      handleConnected();
      handleClosed();
      if (autoConnect) {
        client.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const actions = React.useMemo(() => {
    const client = clientRef.current!;
    return {
      markAsRead: () => client.markAsRead(),
      markAppAsRead: (appId: string) => client.markAppAsRead(appId),
      markGroupAsRead: (groupId: string) => client.markGroupAsRead(groupId),
      markNotificationAsRead: (notificationId: string) => client.markNotificationAsRead(notificationId),

      deleteNotifications: () => client.deleteNotifications(),
      deleteAppNotifications: (appId: string) => client.deleteAppNotifications(appId),
      deleteGroupNotifications: (groupId: string) => client.deleteGroupNotifications(groupId),
      deleteNotification: (notificationId: string) => client.deleteNotification(notificationId),

      reloadNotifications: () => client.reloadNotifications(),
      toggleNotificationStatus: (appId: string, enabled: boolean) =>
        client.toggleNotificationStatus(appId, enabled),
    };
  }, []);

  const value = React.useMemo(
    () => ({
      client: clientRef.current,
      state,
      actions,
    }),
    [state, actions],
  );

  return <R2NotifyContext.Provider value={value}>{children}</R2NotifyContext.Provider>;
};
