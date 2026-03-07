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
  - Creates and owns a single client instance per provider
  - Subscribes to notification events and caches them in React state
  - Re-creates the client if `url`, `token`, or `debug` props change
  - Exposes hooks for state, actions, and custom events

---

## Basic Usage

### Wrap Your Application

```tsx
import { R2NotifyProvider } from "r2-notify-react";

function App() {
  return (
    <R2NotifyProvider
      url="wss://notifications.example.com/ws"
      token="your-auth-token"
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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | *required* | WebSocket server URL |
| `token` | `string` | *required* | Authentication token. Provider will not connect if absent |
| `autoConnect` | `boolean` | `true` | Auto-connect on mount |
| `reconnect` | `boolean` | `true` | Enable automatic reconnection on disconnect |
| `reconnectDelayMs` | `number` | `1500` | Delay before reconnection attempt (ms) |
| `debug` | `boolean` | `false` | Enable debug logging |

> The provider will not attempt to connect if `token` is not provided. The client is automatically closed and cleaned up on unmount.

---

## Hooks API

### `useNotifications()`

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

| Field | Type | Description |
|-------|------|-------------|
| `isConnected` | `boolean` | Current WebSocket connection status |
| `listNotifications` | `NotificationMessage[] \| undefined` | Full list of notifications from the server |
| `newNotification` | `NotificationMessage \| undefined` | Most recently pushed notification |
| `listConfigurations` | `NotificationConfig \| undefined` | Notification configuration for this user |
| `lastError` | `Error \| undefined` | Last connection or protocol error |

---

### `useNotifyActions()`

Returns memoized action functions mapped directly to client commands. All references are stable and safe to use in React dependency arrays.

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

| Action | Signature | Description |
|--------|-----------|-------------|
| `markAsRead` | `() => void` | Mark all notifications as read |
| `markAppAsRead` | `(appId: string) => void` | Mark all notifications for an app as read |
| `markGroupAsRead` | `(appId: string, groupKey: string) => void` | Mark all notifications in a group as read |
| `markNotificationAsRead` | `(id: string) => void` | Mark a single notification as read |
| `deleteNotifications` | `() => void` | Delete all notifications |
| `deleteAppNotifications` | `(appId: string) => void` | Delete all notifications for an app |
| `deleteGroupNotifications` | `(appId: string, groupKey: string) => void` | Delete all notifications in a group |
| `deleteNotification` | `(id: string) => void` | Delete a single notification |
| `reloadNotifications` | `() => void` | Request a fresh notification list from the server |
| `setNotificationStatus` | `(enableNotification: boolean) => void` | Enable or disable notifications for this user |

---

### `useNotifyEvent(event, handler)`

Subscribe to any `NotifyEvent` in a React-safe way. Automatically subscribes on mount and unsubscribes on unmount.

```ts
import type { NotifyEvent } from "r2-notify-react";

useNotifyEvent<NotificationMessage>("newNotification", (payload) => {
  console.log("New notification received", payload);
});
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `NotifyEvent` | The event name to subscribe to |
| `handler` | `(payload: TPayload) => void` | Handler called with the typed payload |

Valid event names are: `"listNotifications"` \| `"newNotification"` \| `"listConfigurations"`

> The handler is wrapped internally to satisfy the emitter's `unknown` payload contract, so you can type `TPayload` safely.

---

### `useNotifyClient()`

Direct access to the underlying `R2NotifyClient` instance. Returns `null` if the client has not been created yet (e.g. `token` is missing).

```ts
const client = useNotifyClient();
client?.reloadNotifications();
```

Use only for advanced or custom scenarios not covered by the other hooks.

---

### `useR2Notify()`

Low-level access to the full context value: `{ client, state, actions }`.

```ts
const { client, state, actions } = useR2Notify();
```

> ⚠️ Throws if used outside of `<R2NotifyProvider>`.

---

## Connection Lifecycle

- The client is created when the provider mounts and `token` is present
- The client automatically connects if `autoConnect` is `true` (default)
- If `url`, `token`, or `debug` props change, the existing client is closed and a new one is created
- The client is closed and all event listeners are removed on unmount
- Reconnection is handled automatically by `r2-notify-client` unless `reconnect: false` is set

---

## TypeScript Support

This package is written in TypeScript and exports the following types:

```ts
import type {
  R2NotifyReactOptions,
  R2NotifyState,
  NotifyEvent,
  R2NotifyClientOptions,
} from "r2-notify-react";
```

| Type | Description |
|------|-------------|
| `R2NotifyReactOptions` | Props accepted by `<R2NotifyProvider>` (extends `R2NotifyClientOptions`) |
| `R2NotifyState` | Shape of the cached state returned by `useNotifications()` |
| `NotifyEvent` | Union of server event name strings |
| `R2NotifyClientOptions` | Re-exported from `r2-notify-client` |

---

## Example

```tsx
import { R2NotifyProvider, useNotifications, useNotifyActions } from "r2-notify-react";

function NotificationList() {
  const { isConnected, listNotifications, lastError } = useNotifications();
  const { markNotificationAsRead, deleteNotification, reloadNotifications } = useNotifyActions();

  if (!isConnected) return <p>Connecting...</p>;
  if (lastError) return <p>Error: {lastError.message}</p>;

  return (
    <div>
      <button onClick={reloadNotifications}>Refresh</button>
      {listNotifications?.map((notif) => (
        <div key={notif.id}>
          <span>{notif.message}</span>
          <button onClick={() => markNotificationAsRead(notif.id)}>Mark as Read</button>
          <button onClick={() => deleteNotification(notif.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <R2NotifyProvider url="wss://notifications.example.com/ws" token="your-auth-token">
      <NotificationList />
    </R2NotifyProvider>
  );
}
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

- **r2-notify-client** - Core WebSocket notification client

---

## License

MIT © Sherantha Perera