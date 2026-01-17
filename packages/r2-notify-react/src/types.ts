
import type { R2NotifyClientOptions, NotifyEvent } from "r2-notify-client";

export type { NotifyEvent, R2NotifyClientOptions };

export interface R2NotifyReactOptions extends R2NotifyClientOptions {
  
    /**
     * Client ID used to identify this client.
     */
    clientId: string;
  /**
   * Auto-connect on mount (default true).
   */
  autoConnect?: boolean;
}

export type Notification = {
  id: string;
  appId: string;
  userId: string;
  groupKey: string;
  message: string;
  status: "success" | "error" | "warning" | "info";
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
};
export type NotificationConfig = {
  id: string;
  userId: string;
  enableNotification: boolean
};

export interface R2NotifyState {
  isConnected: boolean;
  lastError?: Error;
  listNotifications?: Notification[];
  newNotification?: Notification;
  listConfigurations?: NotificationConfig;
}
