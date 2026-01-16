export type WSLike = WebSocket; // Browser WebSocket

export class Connection {
  private ws?: WSLike;
  private url: string;
  private token?: string;
  private debug: boolean;

  /**
   * Creates a new Connection instance.
   *
   * @param {string} url - The URL of the WebSocket endpoint.
   * @param {string} [token] - The authentication token to use for the connection. If not provided, the connection will not be authenticated.
   * @param {boolean} [debug=false] - Whether to enable debug logging for the connection.
   */
  constructor(url: string, token?: string, debug: boolean = false) {
    this.url = url;
    this.token = token;
    this.debug = debug;
  }

  /**
   * Establishes a WebSocket connection to the specified URL.
   *
   * @param {((data: any) => void)} onMessage - A callback function to handle incoming messages from the WebSocket connection.
   * @param {((ev: CloseEvent) => void)} onClose - A callback function to handle the WebSocket connection being closed.
   * @param {(() => void)} [onOpen] - An optional callback function to handle the WebSocket connection being opened.
   * @param {(() => void)} [onError] - An optional callback function to handle the WebSocket connection on error.
   */
  connect(onMessage: (data: any) => void, onClose: (ev: CloseEvent) => void, onOpen?: () => void, onError?: (ev: Event) => void) {
    const headersParam = this.token ? `?token=${encodeURIComponent(this.token)}` : "";
    const ws = new WebSocket(`${this.url}${headersParam}`);
    this.ws = ws;

    /**
     * Called when the WebSocket connection is opened.
     *
     * If `debug` is true, logs a message to the console indicating that the connection is open.
     * If `onOpen` is provided, calls it with no arguments.
     */
    ws.onopen = () => {
      if (this.debug) console.log("[r2] connected");
      onOpen?.();
    };
    /**
     * Handles incoming messages from the WebSocket connection.
     *
     * Tries to parse the incoming message as JSON and calls the `onMessage` callback with the parsed data.
     * If the message is not valid JSON, logs a warning to the console if `debug` is true.
     */
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        onMessage(data);
      } catch (e) {
        if (this.debug) console.warn("[r2] invalid json", e);
      }
    };
    /**
     * Called when the WebSocket connection is closed.
     *
     * If `debug` is true, logs a message to the console indicating that the connection is closed, including the close event code and reason.
     * Calls the `onClose` callback with the close event.
     */
    ws.onclose = (ev) => {
      if (this.debug) console.log("[r2] closed", ev.code, ev.reason);
      onClose(ev);
    };
    /**
     * Called when an error occurs with the WebSocket connection.
     *
     * If `debug` is true, logs an error message to the console with the error object.
     */
    ws.onerror = (err) => {
      if (this.debug) console.error("[r2] error", err);
      onError?.(err);
    };
  }

  /**
   * Sends a message to the WebSocket connection.
   *
   * @param {unknown} obj - The message to be sent. The object will be stringified with JSON.stringify() before being sent.
   *
   * @throws {Error} If the WebSocket connection is not open, throws an error.
   */
  send(obj: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    this.ws.send(JSON.stringify(obj));
  }

  /**
   * Closes the WebSocket connection.
   *
   * @param {number} [code] - The close event code to send to the server.
   * @param {string} [reason] - The close event reason to send to the server.
   */
  close(code?: number, reason?: string) {
    this.ws?.close(code, reason);
  }

  /**
   * Checks if the WebSocket connection is currently open.
   *
   * @returns {boolean} True if the connection is open, false otherwise.
   */
  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
