# r2-notify

A TypeScript monorepo for real-time WebSocket notifications. Contains two publishable npm packages:

| Package | Version | Description |
|---|---|---|
| [`r2-notify-client`](packages/r2-notify-client) | 1.1.3 | Framework-agnostic WebSocket notification client |
| [`r2-notify-react`](packages/r2-notify-react) | 1.1.1 | React bindings (Provider + hooks) built on top of the client |

---

## Repository Structure

```
r2-notify/
├── packages/
│   ├── r2-notify-client/     # Core WebSocket client (no framework deps)
│   └── r2-notify-react/      # React context provider + hooks
├── package.json              # Workspace root (npm workspaces)
└── Readme.md
```

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Local Development Setup

Install all dependencies from the repo root:

```bash
npm install
```

Build both packages (client first, then react):

```bash
npm run build:packages
```

To build and watch a single package during development:

```bash
cd packages/r2-notify-client
npm run dev

# or

cd packages/r2-notify-react
npm run dev
```

---

## Running Tests & Linting

Run from inside each package directory:

```bash
npm run test        # run tests once
npm run test:watch  # watch mode
npm run lint        # ESLint
npm run format      # Prettier
```

---

## Publishing to npm

### Step 1 — Bump the version

**You must increment the version before every publish.** Both packages are versioned independently.

Navigate to the package you are publishing:

```bash
cd packages/r2-notify-client
# or
cd packages/r2-notify-react
```

Use one of the following depending on the nature of your change:

```bash
npm version patch    # bug fix:        1.1.3 -> 1.1.4
npm version minor    # new feature:    1.1.3 -> 1.2.0
npm version major    # breaking change: 1.1.3 -> 2.0.0
```

This updates `version` in the package's `package.json` and creates a git tag automatically.

> If `r2-notify-react` depends on a new feature in `r2-notify-client`, bump and publish `r2-notify-client` first before bumping `r2-notify-react`.

### Step 2 — Login to npm (first time only)

```bash
npm login
```

Verify you are logged in as the correct user:

```bash
npm whoami
```

### Step 3 — Publish

From inside the package directory:

```bash
npm publish
```

The `prepublishOnly` hook runs build → test → lint before publishing.

```bash
npm run build && npm run test && npm run lint
npm publish
```

### Step 4 — Push the version tag

```bash
git push && git push --tags
```

---

## Publishing Checklist

- [ ] Version bumped in `package.json` (`npm version patch|minor|major`)
- [ ] All tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Logged into npm as the correct user (`npm whoami`)
- [ ] Published (`npm publish`)
- [ ] Version tag pushed to remote (`git push --tags`)

---

## Package Details

### r2-notify-client

Framework-agnostic WebSocket client that connects to an `r2-notify-server` instance, handles the two-step authentication handshake, and emits typed notification events.

**Install:**
```bash
npm install r2-notify-client
```

**Basic usage:**
```ts
import { R2NotifyClient } from "r2-notify-client";

const client = new R2NotifyClient({
  serverUrl: "wss://your-server.com",
  apiKey: "your-api-key",
});

client.on("notification", (msg) => console.log(msg));
client.connect();
```

See [packages/r2-notify-client/README.md](packages/r2-notify-client/README.md) for the full API reference.

---

### r2-notify-react

React context provider and hooks that wrap `r2-notify-client` for use in React 18/19 applications.

**Install:**
```bash
npm install r2-notify-react r2-notify-client
```

**Basic usage:**
```tsx
import { R2NotifyProvider, useNotifications, useNotifyActions } from "r2-notify-react";

function App() {
  return (
    <R2NotifyProvider serverUrl="wss://your-server.com" apiKey="your-api-key">
      <NotificationBell />
    </R2NotifyProvider>
  );
}

function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const { markAsRead } = useNotifyActions();
  // ...
}
```

See [packages/r2-notify-react/README.md](packages/r2-notify-react/README.md) for the full hooks API.

---

## License

MIT — Sherantha Perera
