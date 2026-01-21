export type NotifyEvent = "listNotifications" | "newNotification" | "listConfigurations";

export type ClientLifecycleEvent = "connected" | "disconnected" | "error";

export type R2NotifyClientEvent = NotifyEvent | ClientLifecycleEvent;

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
  | "setNotificationStatus";

export interface ActionEnvelope<TPayload = unknown> {
  event: NotifyAction;
  data?: TPayload;
}

export interface ServerEventEnvelope<TEvent = NotifyEvent, TPayload = unknown> {
  event: TEvent;
  data: TPayload;
}

export interface R2NotifyClientOptions {
  url: string;
  clientId: string;
  token?: string;
  reconnect?: boolean;
  reconnectDelayMs?: number;
  // heartbeatMs?: number;
  debug?: boolean;
}

// Notification types and interfaces
export interface NotificationMessage {
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

export interface NotificationGroup {
  groupKey: string;
  latest: number;
  unread: number;
  items: NotificationMessage[];
}
export interface NotificationApp {
  appId: string;
  latest: number;
  unread: number;
  groups: NotificationGroup[];
  total: number;
}

export type NotificationConfig = {
  id: string;
  userId: string;
  enableNotification: boolean;
};
