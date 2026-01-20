
import type { R2NotifyClientOptions, NotifyEvent, NotificationMessage, NotificationConfig } from "r2-notify-client";

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

export interface R2NotifyState {
  /**
   * True if the WebSocket connection is currently open.
   */
  isConnected: boolean;
  /**
   * The last error that occurred with the WebSocket connection.
   */
  lastError?: Error;
  /**
   * The list of notifications received from the server.
   */
  listNotifications?: NotificationMessage[];
  /**
   * The new notification received from the server.
   */
  newNotification?: NotificationMessage;
  /**
   * The list of configurations received from the server.
   */
  listConfigurations?: NotificationConfig;
}
