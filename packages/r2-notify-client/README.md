# r2-notify-client

Framework-agnostic TypeScript client for [r2-notify-server](https://github.com/sheranthaperera93/r2-notify-server). Connects over WebSocket and lets you receive real-time notifications and send actions back to the server.

Works with React, Vue, Svelte, vanilla JS — or any environment that supports WebSocket and `fetch`.

---

## Features

- 🔌 **Real-time notifications** over WebSocket
- 🔐 **Secure auth** — two-step token exchange keeps your API key out of URLs
- 🔄 **Automatic reconnection** with configurable delay
- 🎯 **Fully typed** — written in TypeScript with exported types for everything
- 🪶 **Lightweight** — only one dependency (`eventemitter3`)
- 🎭 **Event-driven** — subscribe to server events and lifecycle changes with `.on()`

---

## Installation

```bash
npm install r2-notify-client
```

---

## Quick Start

```typescript
import { R2NotifyClient } from 'r2-notify-client';

const client = new R2NotifyClient({
  serverUrl: 'https://your-r2-notify-server.com',
  apiKey: 'your-api-key',
});

client.on('connected', () => console.log('Connected'));
client.on('disconnected', () => console.log('Disconnected'));
client.on('error', (err) => console.error('Error:', err));

client.on('listNotifications', (notifications) => {
  console.log('All notifications:', notifications);
});

client.on('newNotification', (notification) => {
  console.log('New notification arrived:', notification);
});

await client.connect();
```

You can also pass event handlers directly into `connect()`:

```typescript
await client.connect({
  listNotifications: (notifications) => { ... },
  newNotification: (notification) => { ... },
  listConfigurations: (config) => { ... },
});
```

> **Note:** handlers passed to `connect()` only cover notification events (`listNotifications`, `newNotification`, `listConfigurations`). For lifecycle events (`connected`, `disconnected`, `error`) always use `.on()`.

---

## How It Works

The client performs a two-step connection automatically — you never need to manage this yourself:

1. POSTs your API key to `{serverUrl}/ws-token` via HTTPS → receives a short-lived token
2. Opens a WebSocket to `{serverUrl}/ws?token=<token>`

The `serverUrl` protocol determines both connections:

| `serverUrl` | Token endpoint | WebSocket |
|---|---|---|
| `http://localhost:8081` | `http://localhost:8081/ws-token` | `ws://localhost:8081/ws` |
| `https://your-server.com` | `https://your-server.com/ws-token` | `wss://your-server.com/ws` |

Your API key only ever travels in an HTTPS `Authorization` header — it never appears in a WebSocket URL.

On every reconnect a fresh token is fetched automatically, so page refreshes, network drops, and tab restores all work without any extra handling on your end.

---

## Configuration

```typescript
new R2NotifyClient({
  serverUrl: 'https://your-server.com', // required
  apiKey: 'your-api-key',               // required
  reconnect: true,                       // default true
  reconnectDelayMs: 1500,               // default 1500
  debug: false,                          // default false
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `serverUrl` | `string` | required | Base URL of your r2-notify-server instance |
| `apiKey` | `string` | required | Your API key |
| `reconnect` | `boolean` | `true` | Automatically reconnect when the connection drops |
| `reconnectDelayMs` | `number` | `1500` | How long to wait before reconnecting (ms) |
| `debug` | `boolean` | `false` | Print WebSocket activity to the console |

---

## API Reference

### `connect(handlers?)`

Fetches a token and opens the WebSocket. Returns `this` for chaining. `async` — await it if you need to act after the token exchange completes.

```typescript
await client.connect();
```

### `close()`

Closes the connection and disables auto-reconnect.

```typescript
client.close();
```

### `emitAction(action, payload?)`

Sends a raw action envelope to the server. Prefer the convenience methods below.

```typescript
client.emitAction('markNotificationAsRead', { id: 'abc123' });
```

---

## Events

### Lifecycle

Use `.on()` and `.off()` to subscribe and unsubscribe.

| Event | Payload | Description |
|---|---|---|
| `connected` | `void` | WebSocket connection established |
| `disconnected` | `void` | WebSocket connection closed |
| `error` | `Error` | Connection or token fetch error |

### Notification

| Event | Payload | Description |
|---|---|---|
| `listNotifications` | `NotificationMessage[]` | Full notification list — sent on connect and after any action |
| `newNotification` | `NotificationMessage` | A single notification pushed in real time |
| `listConfigurations` | `NotificationConfig` | User notification config |

---

## Actions

Convenience methods that send the corresponding action to the server. After each action the server responds with an updated `listNotifications` event.

### Mark as read

```typescript
client.markAsRead();
client.markAppAsRead('app-id');
client.markGroupAsRead('app-id', 'group-key');
client.markNotificationAsRead('notification-id');
```

### Delete

```typescript
client.deleteNotifications();
client.deleteAppNotifications('app-id');
client.deleteGroupNotifications('app-id', 'group-key');
client.deleteNotification('notification-id');
```

### Other

```typescript
client.reloadNotifications();          // request a fresh list from the server
client.setNotificationStatus(true);    // enable notifications
client.setNotificationStatus(false);   // disable notifications
```

---

## TypeScript Types

```typescript
import type {
  R2NotifyClientOptions,
  NotificationMessage,
  NotificationGroup,
  NotificationApp,
  NotificationConfig,
  NotifyEvent,
  NotifyAction,
  ActionEnvelope,
  ServerEventEnvelope,
} from 'r2-notify-client';
```

### `NotificationMessage`

```typescript
interface NotificationMessage {
  id: string;
  appId: string;
  userId: string;
  groupKey: string;
  message: string;
  status: 'success' | 'error' | 'warning' | 'info';
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### `NotificationConfig`

```typescript
type NotificationConfig = {
  id: string;
  userId: string;
  enableNotification: boolean;
};
```

### `NotificationGroup`

```typescript
interface NotificationGroup {
  groupKey: string;
  latest: number;
  unread: number;
  items: NotificationMessage[];
}
```

### `NotificationApp`

```typescript
interface NotificationApp {
  appId: string;
  latest: number;
  unread: number;
  groups: NotificationGroup[];
  total: number;
}
```

---

## Advanced Usage

### Disable auto-reconnect

```typescript
const client = new R2NotifyClient({
  serverUrl: 'https://your-server.com',
  apiKey: 'your-api-key',
  reconnect: false,
});
```

### Dynamic event listeners

```typescript
const handler = (notification: unknown) => {
  console.log('New notification:', notification);
};

client.on('newNotification', handler);

// Later — clean up
client.off('newNotification', handler);
```

### Debug mode

```typescript
new R2NotifyClient({
  serverUrl: 'https://your-server.com',
  apiKey: 'your-api-key',
  debug: true, // logs all WebSocket activity to the console
});
```

---

## React

For React projects, [`r2-notify-react`](https://www.npmjs.com/package/r2-notify-react) wraps this client with a provider and hooks (`useNotifications`, `useNotifyActions`, `useNotifyEvent`) so you don't need to manage the client instance yourself.

---

## License

MIT © Sherantha Perera