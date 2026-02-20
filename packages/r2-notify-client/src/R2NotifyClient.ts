import EventEmitter from "eventemitter3";
import { Connection } from "./connection";
import { makeAction, isServerEventEnvelope, type EventHandlers } from "./protocol";
import type { R2NotifyClientOptions, NotifyAction, NotifyEvent, R2NotifyClientEvent } from "./types";

export class R2NotifyClient extends EventEmitter<R2NotifyClientEvent> {
  private conn: Connection;
  private opts: Required<Pick<R2NotifyClientOptions, "reconnect" | "reconnectDelayMs" | "debug">> & Omit<R2NotifyClientOptions, "reconnect" | "reconnectDelayMs" | "debug">;
  private reconnectTimer?: number;
  private closedByUser = false;
  private isConnected = false;

  constructor(options: R2NotifyClientOptions) {
    super();
    this.opts = {
      url: options.url,
      token: options.token,
      reconnect: options.reconnect ?? true,
      reconnectDelayMs: options.reconnectDelayMs ?? 1500,
      debug: options.debug ?? false,
    };
    this.conn = new Connection(this.opts.url, this.opts.token, this.opts.debug);
  }

  connect(handlers?: EventHandlers) {
    if (this.isConnected) return this;

    this.isConnected = true;

    if (handlers) {
      for (const [evt, fn] of Object.entries(handlers)) {
        if (fn) {
          this.on(evt as NotifyEvent, fn);
        }
      }
    }

    const onMessage = (data: unknown) => {
      if (isServerEventEnvelope(data)) {
        const { event } = data;
        const payload = "payload" in data ? data.payload : data.data;
        if (this.opts.debug) console.log("[r2 client] <-", event, payload);
        this.emit(event as NotifyEvent, payload as unknown);
      } else {
        if (this.opts.debug) console.warn("[r2 client] unknown message", data);
      }
    };

    const onOpen = () => {
      if (this.opts.debug) console.log("[r2 client] connected");
      this.emit("connected"); // payload: void
    };

    const onClose = (_ev: CloseEvent) => {
      if (this.opts.debug) console.log("[r2 client] disconnected");
      this.emit("disconnected"); // payload: void
      if (!this.closedByUser && this.opts.reconnect) {
        this.scheduleReconnect();
      }
      this.isConnected = false;
    };

    const onError = (err: Event | Error) => {
      const errorObj = err instanceof Error ? err : new Error((err as Event)?.type ? `WebSocket error: ${(err as Event).type}` : "WebSocket error");
      if (this.opts.debug) console.error("[r2 client] ws error", errorObj);
      this.emit("error", errorObj);
    };

    this.conn.connect(onMessage, onClose, onOpen, onError);
    return this;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.opts.debug) console.log("[r2 client] scheduling reconnect");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.closedByUser) return;
      this.conn = new Connection(this.opts.url, this.opts.token, this.opts.debug);
      this.connect(); // emits "connected" on success
    }, this.opts.reconnectDelayMs) as unknown as number;
  }

  close() {
    this.closedByUser = true;
    this.conn.close(1000, "client-close");
  }

  // ---- Action Emitters ----
  emitAction<TPayload = unknown>(action: NotifyAction, payload?: TPayload) {
    const envelope = makeAction(action, payload);
    if (this.opts.debug) console.log("[r2 client] ->", envelope);
    this.conn.send(envelope);
  }

  // Convenience helpers...
  markAsRead() {
    this.emitAction("markAsRead");
  }
  markAppAsRead(appId: string) {
    this.emitAction("markAppAsRead", { appId });
  }
  markGroupAsRead(appId: string, groupKey: string) {
    this.emitAction("markGroupAsRead", { appId, groupKey });
  }
  markNotificationAsRead(id: string) {
    this.emitAction("markNotificationAsRead", { id });
  }

  deleteNotifications() {
    this.emitAction("deleteNotifications");
  }
  deleteAppNotifications(appId: string) {
    this.emitAction("deleteAppNotifications", { appId });
  }
  deleteGroupNotifications(appId: string, groupKey: string) {
    this.emitAction("deleteGroupNotifications", { appId, groupKey });
  }
  deleteNotification(id: string) {
    this.emitAction("deleteNotification", { id });
  }

  reloadNotifications() {
    this.emitAction("reloadNotifications");
  }
  setNotificationStatus(enableNotification: boolean) {
    this.emitAction("setNotificationStatus", { enableNotification });
  }
}
