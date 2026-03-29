# r2-notify-react

React wrapper for [`r2-notify-client`](https://www.npmjs.com/package/r2-notify-client). Provides a context provider, cached notification state, memoized actions, and hooks so you can work with real-time notifications idiomatically in React without managing any WebSocket lifecycle yourself.

---

## Features

- ⚛️ **Context-based** — wrap your app once, consume notifications anywhere in the tree
- 🔄 **Automatic lifecycle management** — connects on mount, reconnects on drop, cleans up on unmount
- 🔐 **Secure auth built-in** — two-step token exchange is handled transparently by the underlying client
- 📦 **Cached state** — notification list, new notifications, and config are held in React state
- 🧠 **Memoized actions** — stable references, safe to use in dependency arrays
- 🎣 **Full hooks API** — `useNotifications`, `useNotifyActions`, `useNotifyEvent`, `useNotifyClient`
- 🔷 **Full TypeScript support**

---

## Installation

```bash
npm install r2-notify-react r2-notify-client
```

> `r2-notify-client` is a required peer dependency that handles all WebSocket communication.

---

## Quick Start

### 1. Wrap your app with the provider

```tsx
import { R2NotifyProvider } from 'r2-notify-react';

function App() {
  return (
    <R2NotifyProvider
      serverUrl="https://your-r2-notify-server.com"
      apiKey="your-api-key"
    >
      <YourApp />
    </R2NotifyProvider>
  );
}
```

### 2. Consume notifications in any component

```tsx
import { useNotifications, useNotifyActions } from 'r2-notify-react';

function NotificationList() {
  const { isConnected, listNotifications, lastError } = useNotifications();
  const { markNotificationAsRead, deleteNotification } = useNotifyActions();

  if (!isConnected) return <p>Connecting...</p>;
  if (lastError) return <p>Error: {lastError.message}</p>;

  return (
    <ul>
      {listNotifications?.map((n) => (
        <li key={n.id}>
          <span>{n.message}</span>
          <button onClick={() => markNotificationAsRead(n.id)}>Mark read</button>
          <button onClick={() => deleteNotification(n.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## How It Works

- The provider creates one `R2NotifyClient` instance per mount
- On mount (with `autoConnect={true}`), the client fetches a short-lived token from `{serverUrl}/ws-token` and opens a WebSocket — your API key never appears in a URL
- Server events are cached in React state and exposed via hooks
- If `serverUrl`, `apiKey`, or `debug` props change, the old client is closed and a new one is created
- On unmount, the client is closed and all event listeners are removed
- On a network drop, reconnection is automatic — each attempt fetches a fresh token

---

## R2NotifyProvider Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `serverUrl` | `string` | required | Base URL of your r2-notify-server e.g. `https://your-server.com` |
| `apiKey` | `string` | required | Your API key. The provider will not connect if this is absent |
| `autoConnect` | `boolean` | `true` | Automatically connect on mount |
| `reconnect` | `boolean` | `true` | Automatically reconnect when the connection drops |
| `reconnectDelayMs` | `number` | `1500` | Delay before reconnect attempt (ms) |
| `debug` | `boolean` | `false` | Log WebSocket activity to the console |

---

## Hooks API

### `useNotifications()`

Returns cached notification state. Re-renders when any value changes.

```typescript
const {
  isConnected,
  listNotifications,
  newNotification,
  listConfigurations,
  lastError,
} = useNotifications();
```

| Field | Type | Description |
|---|---|---|
| `isConnected` | `boolean` | Whether the WebSocket is currently open |
| `listNotifications` | `NotificationMessage[] \| undefined` | Full notification list from the server |
| `newNotification` | `NotificationMessage \| undefined` | Most recently pushed notification |
| `listConfigurations` | `NotificationConfig \| undefined` | User notification config |
| `lastError` | `Error \| undefined` | Last connection or protocol error |

---

### `useNotifyActions()`

Returns memoized action functions. All references are stable across renders — safe to use in `useEffect` dependency arrays and `useCallback`.

```typescript
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

| Action | Signature | Description |
|---|---|---|
| `markAsRead` | `() => void` | Mark all notifications as read |
| `markAppAsRead` | `(appId: string) => void` | Mark all notifications for an app as read |
| `markGroupAsRead` | `(appId: string, groupKey: string) => void` | Mark all notifications in a group as read |
| `markNotificationAsRead` | `(id: string) => void` | Mark a single notification as read |
| `deleteNotifications` | `() => void` | Delete all notifications |
| `deleteAppNotifications` | `(appId: string) => void` | Delete all notifications for an app |
| `deleteGroupNotifications` | `(appId: string, groupKey: string) => void` | Delete all notifications in a group |
| `deleteNotification` | `(id: string) => void` | Delete a single notification |
| `reloadNotifications` | `() => void` | Request a fresh list from the server |
| `setNotificationStatus` | `(enable: boolean) => void` | Enable or disable notifications for this user |

---

### `useNotifyEvent(event, handler)`

Subscribe to any server event in a React-safe way. Attaches on mount, detaches on unmount. Use this when you need to react to an event beyond what `useNotifications()` already caches.

```typescript
import { useNotifyEvent } from 'r2-notify-react';
import type { NotificationMessage } from 'r2-notify-client';

useNotifyEvent<NotificationMessage>('newNotification', (notification) => {
  // Play a sound, show a toast, update local state, etc.
  console.log('New notification:', notification);
});
```

Valid event names: `"listNotifications"` | `"newNotification"` | `"listConfigurations"`

---

### `useNotifyClient()`

Direct access to the underlying `R2NotifyClient` instance. Returns `null` if the client hasn't been created yet (e.g. `apiKey` is missing).

```typescript
const client = useNotifyClient();
client?.reloadNotifications();
```

Use this for advanced scenarios not covered by the other hooks.

---

### `useR2Notify()`

Low-level access to the raw context value: `{ client, state, actions }`.

```typescript
const { client, state, actions } = useR2Notify();
```

> Throws if called outside of `<R2NotifyProvider>`.

---

## Manual Connection Control

Set `autoConnect={false}` to manage the connection yourself — useful for connecting only after a user action.

```tsx
import { useNotifyClient } from 'r2-notify-react';

function ConnectionControls() {
  const client = useNotifyClient();

  return (
    <div>
      <button onClick={() => client?.connect()}>Connect</button>
      <button onClick={() => client?.close()}>Disconnect</button>
    </div>
  );
}

function App() {
  return (
    <R2NotifyProvider serverUrl="..." apiKey="..." autoConnect={false}>
      <ConnectionControls />
    </R2NotifyProvider>
  );
}
```

---

## TypeScript

```typescript
import type {
  R2NotifyReactOptions,
  R2NotifyState,
  NotifyEvent,
  R2NotifyClientOptions,
} from 'r2-notify-react';
```

| Type | Description |
|---|---|
| `R2NotifyReactOptions` | Full props interface for `<R2NotifyProvider>` |
| `R2NotifyState` | Shape of the state returned by `useNotifications()` |
| `NotifyEvent` | Union of server event name strings |
| `R2NotifyClientOptions` | Re-exported from `r2-notify-client` |

---

## When to Use This Package

**Use `r2-notify-react` if:**
- You are building a React application
- You want automatic socket lifecycle management
- You want notification data in React state with no boilerplate

**Use `r2-notify-client` directly if:**
- You are not using React
- You need full manual socket control
- You are integrating with Vue, Svelte, or another framework

---

## Related

- **[r2-notify-client](https://www.npmjs.com/package/r2-notify-client)** — core WebSocket client, framework-agnostic
- **[r2-notify-server](https://github.com/sheranthaperera93/r2-notify-server)** — the Go server that powers everything

---

## License

MIT © Sherantha Perera