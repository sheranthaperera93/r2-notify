export type NotifyEvent =
  | "listNotifications" // full list
  | "newNotification" // incremental updates
  | "listConfigurations"; // config/meta

export type NotifyAction =
  // Mark as Read
  | "markAsRead"
  | "markAppAsRead"
  | "markGroupAsRead"
  | "markNotificationAsRead"
  // Delete
  | "deleteNotifications"
  | "deleteAppNotifications"
  | "deleteGroupNotifications"
  | "deleteNotification"
  // Other
  | "reloadNotifications"
  | "toggleNotificationStatus";

export interface ActionEnvelope<TPayload = unknown> {
  action: NotifyAction;
  payload?: TPayload;
}

export interface ServerEventEnvelope<TEvent = NotifyEvent, TPayload = unknown> {
  event: TEvent;
  payload: TPayload;
}

export interface R2NotifyClientOptions {
  url: string; // wss://...
  token?: string; // JWT or API key for auth (optional)
  reconnect?: boolean;
  reconnectDelayMs?: number;
  heartbeatMs?: number;
  debug?: boolean;
}
