import EventEmitter from "eventemitter3";
import { Connection } from "./connection";
import { makeAction, isServerEventEnvelope, type EventHandlers } from "./protocol";
import type { R2NotifyClientOptions, NotifyAction, NotifyEvent } from "../types";

export class R2NotifyClient extends EventEmitter<NotifyEvent> {
  private conn: Connection;
  private opts: Required<Pick<R2NotifyClientOptions, "reconnect" | "reconnectDelayMs" | "heartbeatMs" | "debug">> &
    Omit<R2NotifyClientOptions, "reconnect" | "reconnectDelayMs" | "heartbeatMs" | "debug">;
  private heartbeatTimer?: number;
  private reconnectTimer?: number;
  private closedByUser = false;

  /**
   * Constructs a new R2NotifyClient instance.
   *
   * @param {R2NotifyClientOptions} options - Options for the R2NotifyClient.
   * @param {string} [options.url] - The URL of the WebSocket endpoint.
   * @param {string} [options.token] - The authentication token to use for the connection. If not provided, the connection will not be authenticated.
   * @param {boolean} [options.reconnect=true] - Whether to reconnect the WebSocket connection if it is closed.
   * @param {number} [options.reconnectDelayMs=1500] - The delay in milliseconds to wait before reconnecting the WebSocket connection.
   * @param {number} [options.heartbeatMs=30000] - The interval in milliseconds at which to send a heartbeat action to the server.
   * @param {boolean} [options.debug=false] - Whether to enable debug logging for the connection.
   */
  constructor(options: R2NotifyClientOptions) {
    super();

    this.opts = {
      url: options.url,
      token: options.token,
      reconnect: options.reconnect ?? true,
      reconnectDelayMs: options.reconnectDelayMs ?? 1500,
      heartbeatMs: options.heartbeatMs ?? 30000,
      debug: options.debug ?? false,
    };

    this.conn = new Connection(this.opts.url, this.opts.token, this.opts.debug);
  }

  /**
   * Connects the R2NotifyClient to the server.
   *
   * @param {EventHandlers} [handlers] - Optional event handlers to register with the client.
   *
   * Registers event handlers with the client if provided and connects to the server.
   * If the connection is closed, stops the heartbeat if it is running and schedules a reconnect if reconnect is enabled.
   *
   * @returns {R2NotifyClient} - The current instance of R2NotifyClient.
   */
  connect(handlers?: EventHandlers): R2NotifyClient {
    if (handlers) {
      for (const [evt, fn] of Object.entries(handlers)) {
        this.on(evt as NotifyEvent, fn as any);
      }
    }

    /**
     * Handles incoming messages from the WebSocket connection.
     *
     * If the message is a server event envelope (i.e. it has an "event" property and a "payload" property),
     * emits the event to the registered event handlers with the payload.
     * If the message is not a server event envelope, logs a warning to the console if debug is enabled.
     */
    const onMessage = (data: any) => {
      if (isServerEventEnvelope(data)) {
        const { event, payload } = data;
        if (this.opts.debug) console.log("[r2] <-", event, payload);
        this.emit(event as NotifyEvent, payload);
      } else {
        if (this.opts.debug) console.warn("[r2] unknown message", data);
      }
    };

    /**
     * Called when the WebSocket connection is closed.
     *
     * Stops the heartbeat if it is running and schedules a reconnect if reconnect is enabled and the connection was not closed by the user.
     */
    const onClose = (_ev: CloseEvent) => {
      this.stopHeartbeat();
      if (!this.closedByUser && this.opts.reconnect) {
        this.scheduleReconnect();
      }
    };

    this.conn.connect(onMessage, onClose, () => {
      this.startHeartbeat();
    });

    return this;
  }

  /**
   * Schedules a reconnect after a specified delay.
   * If the connection was closed by the user, does not schedule a reconnect.
   * If a reconnect is already scheduled, does not schedule another one.
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.opts.debug) console.log("[r2] scheduling reconnect");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.closedByUser) return;
      this.conn = new Connection(this.opts.url, this.opts.token, this.opts.debug);
      this.connect();
    }, this.opts.reconnectDelayMs) as unknown as number;
  }

  /**
   * Starts the heartbeat by sending a ping action to the server at the specified interval.
   * If the heartbeat is already running, stops it before starting a new one.
   * The heartbeat is ignored if an error occurs while sending.
   * The heartbeat interval is specified in milliseconds.
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      try {
        // You can change this to a dedicated ping action if your server expects it
        this.conn.send({ type: "ping", ts: Date.now() });
      } catch {
        // ignored
      }
    }, this.opts.heartbeatMs) as unknown as number;
  }

  /**
   * Stops the heartbeat by clearing the timer and setting it to undefined.
   * If the heartbeat is not running, does nothing.
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Closes the R2NotifyClient and its underlying WebSocket connection.
   *
   * Sets a flag to indicate that the connection was closed by the user.
   * Stops the heartbeat if it is running.
   * Closes the WebSocket connection with a code of 1000 and a reason of "client-close".
   */
  close() {
    this.closedByUser = true;
    this.stopHeartbeat();
    this.conn.close(1000, "client-close");
  }

  /**
   * Emits an action to the server with an optional payload.
   *
   * Creates an ActionEnvelope with the given action and optional payload, then sends it to the server via the WebSocket connection.
   * If debug is enabled, logs the emitted action to the console.
   *
   * @param {NotifyAction} action - The action to emit to the server.
   * @param {TPayload} [payload] - Optional payload to include with the action.
   */
  emitAction<TPayload = unknown>(action: NotifyAction, payload?: TPayload) {
    const envelope = makeAction(action, payload);
    if (this.opts.debug) console.log("[r2] ->", envelope);
    this.conn.send(envelope);
  }

  // Convenience helpers
  markAsRead() {
    this.emitAction("markAsRead");
  }
  markAppAsRead(appId: string) {
    this.emitAction("markAppAsRead", { appId });
  }
  markGroupAsRead(groupId: string) {
    this.emitAction("markGroupAsRead", { groupId });
  }
  markNotificationAsRead(notificationId: string) {
    this.emitAction("markNotificationAsRead", { notificationId });
  }

  deleteNotifications() {
    this.emitAction("deleteNotifications");
  }
  deleteAppNotifications(appId: string) {
    this.emitAction("deleteAppNotifications", { appId });
  }
  deleteGroupNotifications(groupId: string) {
    this.emitAction("deleteGroupNotifications", { groupId });
  }
  deleteNotification(notificationId: string) {
    this.emitAction("deleteNotification", { notificationId });
  }

  reloadNotifications() {
    this.emitAction("reloadNotifications");
  }
  toggleNotificationStatus(appId: string, enabled: boolean) {
    this.emitAction("toggleNotificationStatus", { appId, enabled });
  }
}
