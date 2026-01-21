
# r2-notify-react

React bindings for **r2-notify-client**.  
Provides a Provider and hooks to consume real-time events and dispatch actions.

## Install (in a workspace)
```bash
npm install
# react wrapper depends on workspace:* r2-notify-client
```

## Quick Start
```typescript
import { R2NotifyProvider, useNotifications, useNotifyActions } from "r2-notify-react";

function NotificationsPanel() {
  const { isConnected, notificationList } = useNotifications();
  const { markAsRead, reloadNotifications } = useNotifyActions();

  return (
    <div>
      <div>Connected: {String(isConnected)}</div>
      <button onClick={() => reloadNotifications()}>Reload</button>
      <button onClick={() => markAsRead()}>Mark all read</button>
      <pre>{JSON.stringify(notificationList, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  return (
    <R2NotifyProvider url="ws://localhost:8080/ws" debug>
      <NotificationsPanel />
    </R2NotifyProvider>
  );
}

```
## API

- <R2NotifyProvider {...clientOptions} autoConnect? />
- useNotifications() → { isConnected, notificationList, newNotificationList, configuration, lastError }
- useNotifyActions() → { markAsRead, markAppAsRead, markGroupAsRead, markNotificationAsRead, deleteNotifications, deleteAppNotifications, deleteGroupNotifications, deleteNotification, reloadNotifications, setNotificationStatus }
- useR2Notify() → raw { client, state, actions }
- useNotifyEvent(event, handler) → subscribe to any server event


## Workspace wiring (root)

At your **workspace root** `package.json`, ensure:

```json
{
  "name": "r2-notify",
  "private": true,
  "workspaces": ["packages/*"]
}
```
Then from root:

```bash
npm install
```
