export class Connection {
  private ws?: WebSocket;
  private serverUrl: string;
  private apiKey: string;
  private debug: boolean;

  constructor(serverUrl: string, apiKey: string, debug: boolean = false) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.debug = debug;
  }

  private getTokenUrl(): string {
    return `${this.serverUrl}/ws-token`;
  }

  private getWsUrl(): string {
    return this.serverUrl.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://") + "/ws";
  }

  async connect(onMessage: (data: unknown) => void, onClose: (ev: CloseEvent) => void, onOpen?: () => void, onError?: (ev: Event | Error) => void): Promise<void> {
    if (!this.apiKey) {
      if (this.debug) console.error("[r2 client] no apiKey provided");
      return;
    }

    let token: string;
    try {
      const res = await fetch(this.getTokenUrl(), {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
      const body = await res.json();
      token = body.token;
    } catch (err) {
      if (this.debug) console.error("[r2 client] token fetch error", err);
      onError?.(err instanceof Error ? err : new Error("Token fetch failed"));
      return;
    }

    const ws = new WebSocket(`${this.getWsUrl()}?token=${token}`);
    this.ws = ws;

    ws.onopen = () => {
      if (this.debug) console.log("[r2 client] connected");
      onOpen?.();
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        onMessage(data);
      } catch (e) {
        if (this.debug) console.warn("[r2 client] invalid json", e);
      }
    };

    ws.onclose = (ev) => {
      if (this.debug) console.log("[r2 client] closed", ev.code, ev.reason);
      onClose(ev);
    };

    ws.onerror = (err) => {
      if (this.debug) console.error("[r2 client] error", err);
      onError?.(err);
    };
  }

  send(obj: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    this.ws.send(JSON.stringify(obj));
  }

  close(code?: number, reason?: string) {
    this.ws?.close(code, reason);
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
