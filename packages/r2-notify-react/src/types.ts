
import type { R2NotifyClientOptions, NotifyEvent } from "r2-notify-client";

export type { NotifyEvent, R2NotifyClientOptions };

export interface R2NotifyReactOptions extends R2NotifyClientOptions {
  /**
   * Auto-connect on mount (default true).
   */
  autoConnect?: boolean;
}

export type NotificationList = unknown; // Replace with your concrete list type if you have it
export type NotificationConfig = unknown; // Replace with your concrete config type if you have it

export interface R2NotifyState {
  isConnected: boolean;
  lastError?: Error;
  // Cached slices (optional)
  notificationList?: NotificationList;
  newNotificationList?: NotificationList;
  notificationListConfiguration?: NotificationConfig;
}
