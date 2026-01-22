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
- 🔐 **Token-based authentication** support (Road Map)

## Quick Start

```typescript
import { R2NotifyClient } from 'r2-notify-client';

const client = new R2NotifyClient({
  url: 'wss://your-websocket-server.com',
  clientId: 'unique-user-id',
  token: 'optional-auth-token',
  reconnect: true,
  reconnectDelayMs: 1500,
  debug: false
});

// Connect and listen for events
client.connect({
  connected: () => {
    console.log('Connected to notification server');
  },
  disconnected: () => {
    console.log('Disconnected from server');
  },
  listNotifications: (notifications) => {
    console.log('Received notifications:', notifications);
  },
  newNotification: (notification) => {
    console.log('New notification:', notification);
  },
  error: (error) => {
    console.error('Connection error:', error);
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | WebSocket server URL |
| `clientId` | `string` | *required* | Unique client identifier |
| `token` | `string` | `undefined` | Optional authentication token |
| `reconnect` | `boolean` | `true` | Enable automatic reconnection |
| `reconnectDelayMs` | `number` | `1500` | Delay before reconnection attempt (ms) |
| `debug` | `boolean` | `false` | Enable debug logging |

## API Reference

### Events

Listen to events using the `connect()` method or by using `.on()`:

#### Lifecycle Events
- `connected` - Fired when WebSocket connection is established
- `disconnected` - Fired when WebSocket connection is closed
- `error` - Fired when an error occurs

#### Notification Events
- `listNotifications` - Receives list of notifications
- `newNotification` - Receives a new notification
- `listConfigurations` - Receives notification configurations

### Actions

Send actions to the server to manage notifications:

#### Mark as Read
```typescript
// Mark all notifications as read
client.markAsRead();

// Mark all notifications from a specific app as read
client.markAppAsRead('app-id');

// Mark all notifications in a group as read
client.markGroupAsRead('app-id', 'group-key');

// Mark a specific notification as read
client.markNotificationAsRead('notification-id');
```

#### Delete Notifications
```typescript
// Delete all notifications
client.deleteNotifications();

// Delete all notifications from a specific app
client.deleteAppNotifications('app-id');

// Delete all notifications in a group
client.deleteGroupNotifications('app-id', 'group-key');

// Delete a specific notification
client.deleteNotification('notification-id');
```

#### Other Actions
```typescript
// Reload all notifications from server
client.reloadNotifications();

// Enable or disable notifications
client.setNotificationStatus(true); // enable
client.setNotificationStatus(false); // disable
```

### Custom Actions

For custom actions not covered by convenience methods:

```typescript
client.emitAction('customAction', { customData: 'value' });
```

## Advanced Usage

### Event Listeners

You can add event listeners dynamically:

```typescript
client.on('newNotification', (notification) => {
  console.log('New notification received:', notification);
});

client.on('error', (error) => {
  console.error('Error occurred:', error);
});
```

### Manual Connection Management

```typescript
const client = new R2NotifyClient({
  url: 'wss://your-server.com',
  clientId: 'user-123',
  reconnect: false // Disable auto-reconnect
});

// Connect manually
client.connect();

// Close connection
client.close();
```

### TypeScript Support

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

## Data Types

### NotificationMessage
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

### NotificationGroup
```typescript
interface NotificationGroup {
  groupKey: string;
  latest: number;
  unread: number;
  items: NotificationMessage[];
}
```

### NotificationApp
```typescript
interface NotificationApp {
  appId: string;
  latest: number;
  unread: number;
  groups: NotificationGroup[];
  total: number;
}
```

## Examples

### React Integration

```typescript
import { useEffect, useState } from 'react';
import { R2NotifyClient } from 'r2-notify-client';

function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);
  const [client] = useState(() => new R2NotifyClient({
    url: 'wss://your-server.com',
    clientId: 'user-123'
  }));

  useEffect(() => {
    client.connect({
      listNotifications: (data) => setNotifications(data),
      newNotification: (notification) => {
        setNotifications(prev => [...prev, notification]);
      }
    });

    return () => client.close();
  }, [client]);

  return (
    <div>
      {notifications.map(notif => (
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

### Vue Integration

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { R2NotifyClient } from 'r2-notify-client';

const notifications = ref([]);
const client = new R2NotifyClient({
  url: 'wss://your-server.com',
  clientId: 'user-123'
});

onMounted(() => {
  client.connect({
    listNotifications: (data) => {
      notifications.value = data;
    },
    newNotification: (notification) => {
      notifications.value.push(notification);
    }
  });
});

onUnmounted(() => {
  client.close();
});
</script>
```

## License

MIT © Sherantha Perera

## Keywords

notifications, websocket, client, real-time, r2-notify

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.