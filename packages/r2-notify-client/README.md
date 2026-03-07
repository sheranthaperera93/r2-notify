# r2-notify-client

Framework-agnostic WebSocket notification client for r2-notify-server. Consumes real-time events and emits notification actions.

## Installation

```bash
npm install r2-notify-client
```

## Features

- 🔌 **WebSocket-based real-time notifications**
- 🔄 **Automatic reconnection** with configurable delay
- 🎯 **Type-safe event handling** with TypeScript
- 🪶 **Framework-agnostic** - works with React, Vue, vanilla JS, or any other framework
- 📦 **Lightweight** with minimal dependencies
- 🎭 **Event-driven architecture** using EventEmitter3
- 🔐 **Token-based authentication**

## Quick Start

```typescript
import { R2NotifyClient } from 'r2-notify-client';

const client = new R2NotifyClient({
  url: 'wss://your-websocket-server.com',
  token: 'your-auth-token',
  reconnect: true,
  reconnectDelayMs: 1500,
  debug: false
});

// Register event listeners
client.on('connected', () => {
  console.log('Connected to notification server');
});

client.on('disconnected', () => {
  console.log('Disconnected from server');
});

client.on('listNotifications', (notifications) => {
  console.log('Received notifications:', notifications);
});

client.on('newNotification', (notification) => {
  console.log('New notification:', notification);
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});

// Connect
client.connect();
```

Alternatively, pass notification event handlers directly into `connect()`:

```typescript
client.connect({
  listNotifications: (notifications) => {
    console.log('Received notifications:', notifications);
  },
  newNotification: (notification) => {
    console.log('New notification:', notification);
  },
  listConfigurations: (configurations) => {
    console.log('List configurations:', configurations);
  }
});
```

> **Note:** `connect()` handlers only cover `NotifyEvent` types (`listNotifications`, `newNotification`, `listConfigurations`). For lifecycle events (`connected`, `disconnected`, `error`), use `.on()` directly.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | WebSocket server URL |
| `token` | `string` | *required* | Authentication token |
| `reconnect` | `boolean` | `true` | Enable automatic reconnection |
| `reconnectDelayMs` | `number` | `1500` | Delay before reconnection attempt (ms) |
| `debug` | `boolean` | `false` | Enable debug logging |

## API Reference

### `connect(handlers?)`

Opens the WebSocket connection. Optionally accepts a partial map of `NotifyEvent` handlers to register before connecting.

```typescript
client.connect();
// or
client.connect({
  listNotifications: (data) => { ... },
  newNotification: (data) => { ... },
  listConfigurations: (data) => { ... },
});
```

### `close()`

Closes the WebSocket connection and disables auto-reconnect.

```typescript
client.close();
```

### `emitAction(action, payload?)`

Sends a custom action envelope to the server.

```typescript
client.emitAction('action', { key: 'value' });
```

---

### Events

#### Lifecycle Events — use `.on()` / `.off()`

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `void` | WebSocket connection established |
| `disconnected` | `void` | WebSocket connection closed |
| `error` | `Error` | An error occurred |

#### Notification Events — use `.on()` / `.off()` or `connect()` handlers

| Event | Payload | Description |
|-------|---------|-------------|
| `listNotifications` | `NotificationMessage[]` | Full list of notifications received |
| `newNotification` | `NotificationMessage` | A new notification pushed from server |
| `listConfigurations` | `NotificationConfig` | Notification config received |

---

### Actions

Convenience methods that send action envelopes to the server.

#### Mark as Read

```typescript
client.markAsRead();
client.markAppAsRead('app-id');
client.markGroupAsRead('app-id', 'group-key');
client.markNotificationAsRead('notification-id');
```

#### Delete Notifications

```typescript
client.deleteNotifications();
client.deleteAppNotifications('app-id');
client.deleteGroupNotifications('app-id', 'group-key');
client.deleteNotification('notification-id');
```

#### Other

```typescript
client.reloadNotifications();
client.setNotificationStatus(true);  // enable
client.setNotificationStatus(false); // disable
```

---

## Advanced Usage

### Manual Connection Management

```typescript
const client = new R2NotifyClient({
  url: 'wss://your-server.com',
  token: 'your-auth-token',
  reconnect: false, // Disable auto-reconnect
});

client.connect();
// ... later
client.close();
```

### Dynamic Event Listeners

```typescript
const handler = (notification) => {
  console.log('New notification:', notification);
};

client.on('newNotification', handler);

// Clean up when done
client.off('newNotification', handler);
```

---

## TypeScript Support

The package is fully typed. Import types as needed:

```typescript
import type {
  NotificationMessage,
  NotificationApp,
  NotificationGroup,
  NotificationConfig,
  R2NotifyClientOptions
} from 'r2-notify-client';
```

---

## Data Types

### `NotificationMessage`

```typescript
interface NotificationMessage {
  id: string;
  appId: string;
  userId: string;
  groupKey: string;
  message: string;
  status: "success" | "error" | "warning" | "info";
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
}
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

### `NotificationConfig`

```typescript
type NotificationConfig = {
  id: string;
  userId: string;
  enableNotification: boolean;
};
```

---

## Framework Examples

### React (vanilla)

```typescript
import { useEffect, useState } from 'react';
import { R2NotifyClient, NotificationMessage } from 'r2-notify-client';

function NotificationComponent() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const [client] = useState(() => new R2NotifyClient({
    url: 'wss://your-server.com',
    token: 'your-auth-token',
  }));

  useEffect(() => {
    client.on('listNotifications', (data) => {
      setNotifications(data as NotificationMessage[]);
    });
    client.on('newNotification', (data) => {
      setNotifications((prev) => [...prev, data as NotificationMessage]);
    });

    client.connect();
    return () => client.close();
  }, [client]);

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif.id}>
          {notif.message}
          <button onClick={() => client.markNotificationAsRead(notif.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

> For React projects, consider using the **`r2-notify-react`** wrapper package which provides `<R2NotifyProvider>`, `useNotifications()`, `useNotifyActions()`, and `useNotifyEvent()` out of the box.

## License

MIT © Sherantha Perera

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.