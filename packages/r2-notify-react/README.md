# r2-notify-react

**React wrapper for `r2-notify-client`** — providing a context-driven, hook-based API for real-time notifications.

`r2-notify-react` is a lightweight React integration layer built on top of the core `r2-notify-client` WebSocket library. It manages the socket client lifecycle, listens to server events, caches commonly used notification data in React state, and exposes typed hooks for working with notifications safely and idiomatically.

---

## Features

- ✅ React Context–based architecture
- ✅ Automatic WebSocket lifecycle management
- ✅ Cached notification state
- ✅ Memoized, stable action handlers
- ✅ React-safe event subscriptions
- ✅ Full TypeScript support

---

## Installation

```bash
npm install r2-notify-react r2-notify-client
```

> **Note**  
> `r2-notify-client` is a required peer dependency and handles all low-level socket communication.

---

## How It Works

- `r2-notify-client` manages the WebSocket connection and protocol
- `r2-notify-react`:
  - Creates and owns a single client instance
  - Subscribes to notification events
  - Caches server data in React state
  - Exposes hooks for state, actions, and custom events

---

## Basic Usage

### Wrap Your Application

```tsx
import { R2NotifyProvider } from "r2-notify-react";

function App() {
  return (
    <R2NotifyProvider
      clientId="my-app-client"
      url="wss://notifications.example.com/ws"
      autoConnect
      debug
    >
      <Dashboard />
    </R2NotifyProvider>
  );
}
```

---

## R2NotifyProvider

### Props

| Prop | Type | Description |
|------|------|-------------|
| `clientId` | `string` | Unique identifier for this client (required) |
| `autoConnect` | `boolean` | Auto-connect on mount (default: `true`) |
| `debug` | `boolean` | Enable debug logging |
| `...options` | `R2NotifyClientOptions` | All options supported by `r2-notify-client` |

---

## Hooks API

### useNotifications()

Convenience hook for accessing cached notification state.

```ts
const {
  isConnected,
  listNotifications,
  newNotification,
  listConfigurations,
  lastError,
} = useNotifications();
```

#### State Fields

- `isConnected` – Current connection status
- `listNotifications` – Array of notifications received from the server
- `newNotification` – Most recent notification
- `listConfigurations` – Notification configuration list
- `lastError` – Last connection or protocol error

---

### useNotifyActions()

Returns memoized action functions mapped directly to client commands.

```ts
const {
  markAsRead,
  markAppAsRead,
  markGroupAsRead,
  markNotificationAsRead,
  deleteNotifications,
  deleteAppNotifications,
  deleteGroupNotifications,
  deleteNotification,
  reloadNotifications,
  setNotificationStatus,
} = useNotifyActions();
```

#### Available Actions

- `markAsRead()`
- `markAppAsRead(appId)`
- `markGroupAsRead(appId, groupKey)`
- `markNotificationAsRead(id)`
- `deleteNotifications()`
- `deleteAppNotifications(appId)`
- `deleteGroupNotifications(appId, groupKey)`
- `deleteNotification(id)`
- `reloadNotifications()`
- `setNotificationStatus(enable: boolean)`

All action references are stable and safe to use in React dependency arrays.

---

### useNotifyEvent(event, handler)

Subscribe to any server event in a React-safe way.

```ts
import { NotifyEvent } from "r2-notify-client";

useNotifyEvent(NotifyEvent.NewNotification, (payload) => {
  console.log("New notification received", payload);
});
```

- Automatically subscribes on mount
- Automatically unsubscribes on unmount
- Shares the provider-managed client

---

### useNotifyClient()

Direct access to the underlying `R2NotifyClient` instance.

```ts
const client = useNotifyClient();
client?.reloadNotifications();
```

Use only for advanced or custom scenarios.

---

### useR2Notify()

Low-level access to the entire context value.

```ts
const { client, state, actions } = useR2Notify();
```

> ⚠️ Must be used within `<R2NotifyProvider>`.

---

## Connection Lifecycle

- Client instance is created once per provider
- Automatically connects on mount (unless disabled)
- Connection state reflected via `isConnected`
- Client is closed automatically on unmount

---

## TypeScript Support

This package is written in TypeScript and re-exports relevant types.

```ts
import type {
  R2NotifyReactOptions,
  R2NotifyState,
  NotifyEvent,
} from "r2-notify-react";
```

---

## When to Use

✅ Use **r2-notify-react** if:
- You are building a React application
- You want automatic socket lifecycle handling
- Notification data belongs in React state

❌ Use **r2-notify-client** directly if:
- You are not using React
- You need full manual socket control

---

## Related Packages

- **r2-notify-client** – Core WebSocket notification client

---

## License

MIT
