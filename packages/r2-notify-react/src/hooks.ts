
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
 * Convenience hook to access the cached state of the client.
 * The properties are:
 * - isConnected: boolean indicating the connection state
 * - listNotifications: array of NotificationMessage objects (can be empty)
 * - newNotification: The latest NotificationMessage object (can be undefined)
 * - listConfigurations: array of NotificationConfig objects (can be empty)
 * - lastError: Error object if a connection error occurred (can be undefined)
 */
export function useNotifications() {
  const { state } = useR2Notify();
  return {
    isConnected: state.isConnected,
    listNotifications: state.listNotifications,
    newNotification: state.newNotification,
    listConfigurations: state.listConfigurations,
    lastError: state.lastError,
  };
}

/**
 * Convenience hook to access the actions of the client.
 * These actions are memoized by React, so you can safely use them in your components.
 * The actions are:
 * - markAsRead(): Mark all notifications as read
 * - markAppAsRead(appId: string): Mark all notifications of an app as read
 * - markGroupAsRead(appId: string, groupKey: string): Mark all notifications of a group as read
 * - markNotificationAsRead(id: string): Mark a notification as read
 * - deleteNotifications(): Delete all notifications
 * - deleteAppNotifications(appId: string): Delete all notifications of an app
 * - deleteGroupNotifications(appId: string, groupKey: string): Delete all notifications of a group
 * - deleteNotification(id: string): Delete a notification
 * - reloadNotifications(): Reload the notifications
 * - toggleNotificationStatus(appId: string, enabled: boolean): Toggle the notification status of an app
 */
export function useNotifyActions() {
  const { actions } = useR2Notify();
  return actions;
}
