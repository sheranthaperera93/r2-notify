import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Connection } from "../src/connection";

// ── MockWebSocket ─────────────────────────────────────────────────────────────

class MockWebSocket {
  static readonly OPEN = 1;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = 0; // CONNECTING

  send = vi.fn();
  close = vi.fn();

  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  // Simulation helpers used by tests
  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  triggerRawMessage(raw: string) {
    this.onmessage?.({ data: raw });
  }

  triggerClose(code = 1000, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  triggerError(ev: unknown = new Event("error")) {
    this.onerror?.(ev);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastWs(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1]!;
}

function makeFetch(token = "tok-123", ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue({ token }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Connection", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("fetch", makeFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── connect() ──────────────────────────────────────────────────────────────

  describe("connect()", () => {
    it("does not create a WebSocket when apiKey is empty", async () => {
      const conn = new Connection("http://localhost", "", false);
      await conn.connect(vi.fn(), vi.fn());
      expect(MockWebSocket.instances).toHaveLength(0);
    });

    it("fetches the token from {serverUrl}/ws-token with Bearer auth", async () => {
      const fetchSpy = makeFetch();
      vi.stubGlobal("fetch", fetchSpy);

      const conn = new Connection("http://localhost:4000", "my-api-key", false);
      await conn.connect(vi.fn(), vi.fn());

      expect(fetchSpy).toHaveBeenCalledWith("http://localhost:4000/ws-token", {
        method: "POST",
        headers: { Authorization: "Bearer my-api-key" },
      });
    });

    it("calls onError and does not open WebSocket when fetch throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
      const onError = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn(), undefined, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(MockWebSocket.instances).toHaveLength(0);
    });

    it("calls onError when the token endpoint returns a non-ok response", async () => {
      vi.stubGlobal("fetch", makeFetch("", false, 401));
      const onError = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn(), undefined, onError);

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("401") }));
      expect(MockWebSocket.instances).toHaveLength(0);
    });

    it("opens WebSocket to {wsUrl}/ws?token=<token> after successful fetch", async () => {
      const conn = new Connection("http://localhost:4000", "key", false);
      await conn.connect(vi.fn(), vi.fn());

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(lastWs().url).toBe("ws://localhost:4000/ws?token=tok-123");
    });

    it("converts https:// to wss:// in the WebSocket URL", async () => {
      const conn = new Connection("https://example.com", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      expect(lastWs().url).toBe("wss://example.com/ws?token=tok-123");
    });

    it("calls onOpen when the WebSocket fires open", async () => {
      const onOpen = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn(), onOpen);
      lastWs().triggerOpen();
      expect(onOpen).toHaveBeenCalledOnce();
    });

    it("calls onMessage with parsed JSON when a message is received", async () => {
      const onMessage = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(onMessage, vi.fn());
      lastWs().triggerMessage({ event: "listNotifications", data: [] });
      expect(onMessage).toHaveBeenCalledWith({ event: "listNotifications", data: [] });
    });

    it("silently ignores messages that are not valid JSON", async () => {
      const onMessage = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(onMessage, vi.fn());
      // Should not throw
      lastWs().triggerRawMessage("not-json{{");
      expect(onMessage).not.toHaveBeenCalled();
    });

    it("calls onClose when the WebSocket fires close", async () => {
      const onClose = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), onClose);
      lastWs().triggerClose(1001, "going away");
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("calls onError when the WebSocket fires error", async () => {
      const onError = vi.fn();
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn(), undefined, onError);
      const errEvent = new Event("error");
      lastWs().triggerError(errEvent);
      expect(onError).toHaveBeenCalledWith(errEvent);
    });
  });

  // ── send() ─────────────────────────────────────────────────────────────────

  describe("send()", () => {
    it("throws when the WebSocket is not open", async () => {
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      // readyState is 0 (CONNECTING), not OPEN
      expect(() => conn.send({ action: "test" })).toThrow("WebSocket is not open");
    });

    it("sends JSON-stringified data when the WebSocket is open", async () => {
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      lastWs().readyState = MockWebSocket.OPEN;

      conn.send({ event: "markAsRead" });
      expect(lastWs().send).toHaveBeenCalledWith(JSON.stringify({ event: "markAsRead" }));
    });
  });

  // ── close() ────────────────────────────────────────────────────────────────

  describe("close()", () => {
    it("calls ws.close with the given code and reason", async () => {
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      conn.close(1000, "normal");
      expect(lastWs().close).toHaveBeenCalledWith(1000, "normal");
    });

    it("does not throw when called before a WebSocket is created", () => {
      const conn = new Connection("http://localhost", "key", false);
      expect(() => conn.close()).not.toThrow();
    });
  });

  // ── isOpen() ───────────────────────────────────────────────────────────────

  describe("isOpen()", () => {
    it("returns false before connect() is called", () => {
      const conn = new Connection("http://localhost", "key", false);
      expect(conn.isOpen()).toBe(false);
    });

    it("returns false when the WebSocket readyState is CONNECTING (0)", async () => {
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      // readyState is 0 by default in mock
      expect(conn.isOpen()).toBe(false);
    });

    it("returns true when the WebSocket readyState is OPEN", async () => {
      const conn = new Connection("http://localhost", "key", false);
      await conn.connect(vi.fn(), vi.fn());
      lastWs().readyState = MockWebSocket.OPEN;
      expect(conn.isOpen()).toBe(true);
    });
  });
});
