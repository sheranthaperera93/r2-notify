
import { useContext, useEffect, useMemo } from "react";
import { R2NotifyContext } from "./context";
import { NotifyEvent } from "r2-notify-client";

export function useR2Notify() {
  const ctx = useContext(R2NotifyContext);
  if (!ctx) throw new Error("useR2Notify must be used within <R2NotifyProvider>");
  return ctx;
}

/**
 * Subscribe to a server event in a React-safe way.
 * The provider already caches common slices, but this lets you listen to any event ad hoc.
 */
export function useNotifyEvent<TPayload = unknown>(
  event: NotifyEvent,
  handler: (payload: TPayload) => void,
) {
  const { client } = useR2Notify();

  useEffect(() => {
    if (!client) return;
    client.on(event, handler);
    return () => {
      client.off(event, handler);
    };
  }, [client, event, handler]);
}

/**
 * Convenience hook to access cached slices and actions.
 */
export function useNotifications() {
  const { state } = useR2Notify();
  return {
    isConnected: state.isConnected,
    notificationList: state.notificationList,
    newNotificationList: state.newNotificationList,
    configuration: state.notificationListConfiguration,
    lastError: state.lastError,
  };
}

export function useNotifyActions() {
  const { actions } = useR2Notify();
  return actions;
}
