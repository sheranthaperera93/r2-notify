import { describe, it, expect, vi, beforeEach } from "vitest";
import { R2NotifyClient } from "../src/R2NotifyClient";
import { Connection } from "../src/connection";

// ── Mock: Connection ──────────────────────────────────────────────────────────
//
// Using vi.hoisted() so the shared state object is available inside the
// vi.mock() factory (which is hoisted above imports by Vitest).

const connState = vi.hoisted(() => ({
  callbacks: {} as {
    onMessage?: (data: unknown) => void;
    onClose?: (ev: unknown) => void;
    onOpen?: () => void;
    onError?: (ev: unknown) => void;
  },
  inst: null as null | {
    connect: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  },
}));

vi.mock("../src/connection", () => ({
  Connection: vi.fn(function () {
    const inst = {
      connect: vi.fn(async function (onMessage: unknown, onClose: unknown, onOpen: unknown, onError: unknown) {
        connState.callbacks = {
          onMessage: onMessage as (data: unknown) => void,
          onClose: onClose as (ev: unknown) => void,
          onOpen: onOpen as () => void,
          onError: onError as (ev: unknown) => void,
        };
      }),
      send: vi.fn(),
      close: vi.fn(),
    };
    connState.inst = inst;
    return inst;
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_OPTS = { serverUrl: "http://localhost", apiKey: "test-key" };

function makeClient(overrides = {}) {
  return new R2NotifyClient({ ...BASE_OPTS, ...overrides });
}

// Connects the client and resolves the pending mock connect call
async function connectClient(client: R2NotifyClient, handlers?: Parameters<R2NotifyClient["connect"]>[0]) {
  await client.connect(handlers);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("R2NotifyClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connState.callbacks = {};
    connState.inst = null;
  });

  // ── constructor ────────────────────────────────────────────────────────────

  describe("constructor", () => {
    it("creates a Connection with serverUrl, apiKey and debug options", () => {
      makeClient({ debug: true });
      expect(Connection).toHaveBeenCalledWith("http://localhost", "test-key", true);
    });

    it("defaults debug to false", () => {
      makeClient();
      expect(Connection).toHaveBeenCalledWith("http://localhost", "test-key", false);
    });
  });

  // ── connect() ─────────────────────────────────────────────────────────────

  describe("connect()", () => {
    it("calls conn.connect() with four callbacks", async () => {
      const client = makeClient();
      await connectClient(client);
      expect(connState.inst!.connect).toHaveBeenCalledOnce();
      expect(connState.inst!.connect).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("returns the client instance", async () => {
      const client = makeClient();
      const result = await client.connect();
      expect(result).toBe(client);
    });

    it("does not call conn.connect() a second time if already connected", async () => {
      const client = makeClient();
      await connectClient(client);
      await connectClient(client);
      expect(connState.inst!.connect).toHaveBeenCalledOnce();
    });

    it("registers handlers passed as argument on the EventEmitter", async () => {
      const client = makeClient();
      const handler = vi.fn();
      await connectClient(client, { listNotifications: handler });

      // Emit directly on the emitter to verify registration
      client.emit("listNotifications", []);
      expect(handler).toHaveBeenCalledWith([]);
    });
  });

  // ── connected / disconnected events ───────────────────────────────────────

  describe("onOpen callback", () => {
    it("emits 'connected' when the connection opens", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on("connected", listener);
      await connectClient(client);

      connState.callbacks.onOpen?.();
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe("onClose callback", () => {
    it("emits 'disconnected' when the connection closes", async () => {
      const client = makeClient({ reconnect: false });
      const listener = vi.fn();
      client.on("disconnected", listener);
      await connectClient(client);

      connState.callbacks.onClose?.({ code: 1000, reason: "" });
      expect(listener).toHaveBeenCalledOnce();
    });

    it("schedules a reconnect when reconnect=true and not closed by user", async () => {
      vi.useFakeTimers();
      const client = makeClient({ reconnect: true, reconnectDelayMs: 100 });
      await connectClient(client);

      // Trigger close
      connState.callbacks.onClose?.({ code: 1000, reason: "" });

      // Before the timer fires, Connection is only instantiated once
      expect(Connection).toHaveBeenCalledTimes(1);

      // Advance past reconnect delay
      await vi.advanceTimersByTimeAsync(200);

      // A new Connection should have been created for the reconnect attempt
      expect(Connection).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("does not reconnect when reconnect=false", async () => {
      vi.useFakeTimers();
      const client = makeClient({ reconnect: false });
      await connectClient(client);

      connState.callbacks.onClose?.({ code: 1000, reason: "" });
      await vi.advanceTimersByTimeAsync(5000);

      expect(Connection).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("does not reconnect after close() is called by the user", async () => {
      vi.useFakeTimers();
      const client = makeClient({ reconnect: true, reconnectDelayMs: 100 });
      await connectClient(client);

      client.close();
      connState.callbacks.onClose?.({ code: 1000, reason: "" });
      await vi.advanceTimersByTimeAsync(200);

      expect(Connection).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  // ── error event ────────────────────────────────────────────────────────────

  describe("onError callback", () => {
    it("emits 'error' with the Error when an Error object is received", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on("error", listener);
      await connectClient(client);

      const err = new Error("ws failed");
      connState.callbacks.onError?.(err);
      expect(listener).toHaveBeenCalledWith(err);
    });

    it("wraps a non-Error event in a generic Error before emitting", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on("error", listener);
      await connectClient(client);

      connState.callbacks.onError?.(new Event("error"));
      expect(listener).toHaveBeenCalledWith(expect.any(Error));
    });

    it("resets isConnected so a subsequent connect() call works", async () => {
      const client = makeClient();
      await connectClient(client);

      // Error resets isConnected
      connState.callbacks.onError?.(new Error("fail"));

      // Should be able to connect again (connect is called on conn a second time)
      await connectClient(client);
      expect(connState.inst!.connect).toHaveBeenCalledTimes(2);
    });
  });

  // ── message routing ────────────────────────────────────────────────────────

  describe("onMessage callback", () => {
    it("emits the server event with its payload for valid envelopes", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on("listNotifications", listener);
      await connectClient(client);

      connState.callbacks.onMessage?.({ event: "listNotifications", data: [{ id: "1" }] });
      expect(listener).toHaveBeenCalledWith([{ id: "1" }]);
    });

    it("does not emit anything for messages that are not server envelopes", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on("listNotifications", listener);
      await connectClient(client);

      connState.callbacks.onMessage?.("not an object");
      connState.callbacks.onMessage?.(null);
      connState.callbacks.onMessage?.({ noEvent: true, data: [] });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ── close() ───────────────────────────────────────────────────────────────

  describe("close()", () => {
    it("calls conn.close()", async () => {
      const client = makeClient();
      await connectClient(client);
      client.close();
      expect(connState.inst!.close).toHaveBeenCalledOnce();
    });

    it("prevents the reconnect timer from firing after close", async () => {
      vi.useFakeTimers();
      const client = makeClient({ reconnect: true, reconnectDelayMs: 100 });
      await connectClient(client);

      client.close();
      connState.callbacks.onClose?.({ code: 1000, reason: "" });
      await vi.advanceTimersByTimeAsync(500);

      // Still only one Connection created
      expect(Connection).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  // ── emitAction() ──────────────────────────────────────────────────────────

  describe("emitAction()", () => {
    it("sends a JSON envelope through the connection", async () => {
      const client = makeClient();
      await connectClient(client);

      client.emitAction("markAsRead");
      expect(connState.inst!.send).toHaveBeenCalledWith({ event: "markAsRead", data: undefined });
    });

    it("includes the payload in the envelope", async () => {
      const client = makeClient();
      await connectClient(client);

      client.emitAction("markAppAsRead", { appId: "app1" });
      expect(connState.inst!.send).toHaveBeenCalledWith({ event: "markAppAsRead", data: { appId: "app1" } });
    });
  });

  // ── action convenience methods ────────────────────────────────────────────

  describe("action convenience methods", () => {
    let client: R2NotifyClient;

    beforeEach(async () => {
      client = makeClient();
      await connectClient(client);
    });

    it("markAsRead() sends markAsRead action", () => {
      client.markAsRead();
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "markAsRead" }));
    });

    it("markAppAsRead(appId) sends markAppAsRead action with appId", () => {
      client.markAppAsRead("app1");
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "markAppAsRead", data: { appId: "app1" } }));
    });

    it("markGroupAsRead(appId, groupKey) sends action with both params", () => {
      client.markGroupAsRead("app1", "grp");
      expect(connState.inst!.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "markGroupAsRead", data: { appId: "app1", groupKey: "grp" } }),
      );
    });

    it("markNotificationAsRead(id) sends action with id", () => {
      client.markNotificationAsRead("n-1");
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "markNotificationAsRead", data: { id: "n-1" } }));
    });

    it("deleteNotifications() sends deleteNotifications action", () => {
      client.deleteNotifications();
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "deleteNotifications" }));
    });

    it("deleteAppNotifications(appId) sends action with appId", () => {
      client.deleteAppNotifications("app1");
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "deleteAppNotifications", data: { appId: "app1" } }));
    });

    it("deleteGroupNotifications(appId, groupKey) sends action with both params", () => {
      client.deleteGroupNotifications("app1", "grp");
      expect(connState.inst!.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "deleteGroupNotifications", data: { appId: "app1", groupKey: "grp" } }),
      );
    });

    it("deleteNotification(id) sends action with id", () => {
      client.deleteNotification("n-1");
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "deleteNotification", data: { id: "n-1" } }));
    });

    it("reloadNotifications() sends reloadNotifications action", () => {
      client.reloadNotifications();
      expect(connState.inst!.send).toHaveBeenCalledWith(expect.objectContaining({ event: "reloadNotifications" }));
    });

    it("setNotificationStatus(bool) sends action with enableNotification flag", () => {
      client.setNotificationStatus(false);
      expect(connState.inst!.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "setNotificationStatus", data: { enableNotification: false } }),
      );
    });
  });
});
