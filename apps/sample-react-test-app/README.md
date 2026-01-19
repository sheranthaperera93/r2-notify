# R2 Notify Test App

A sample React application for testing the `r2-notify-react` notification library.

## Features

- 🔌 **WebSocket Connection Management** - Connect to the R2 Notify server with configurable URL and client ID
- 📬 **Notifications Dashboard** - View all incoming notifications in real-time
- ⚙️ **Configuration Panel** - Load and inspect server configurations
- 🎨 **Modern UI** - Clean and responsive interface with gradient backgrounds
- ⚡ **Hot Module Replacement** - Fast development with Vite

## Getting Started

### Installation

The dependencies are managed at the monorepo level. To install all dependencies:

```bash
cd ../..
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Open the browser automatically
- Enable hot module replacement for fast development

### Build

Create a production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Architecture

### Components

- **App** - Main component that wraps the application with `R2NotifyProvider`
- **NotificationsDashboard** - Displays received notifications with timestamps
- **ConfigurationPanel** - Shows server configuration and allows loading configuration

### Hooks Used

- `useR2Notify()` - Access the notification context (client and state)
- `useNotifications()` - Access cached notification slices
- `useNotifyActions()` - Access action methods for the client

## Testing the Integration

1. **Start the R2 Notify Server**
   ```bash
   cd ../../r2-notify-server
   go run main.go
   ```

2. **Start the Test App**
   ```bash
   npm run dev
   ```

3. **Connect**
   - The app will attempt to connect to `ws://localhost:8080` by default
   - Modify the WebSocket URL in the Connection Settings panel if needed
   - The status badge shows the connection state (green = connected, red = disconnected)

4. **Receive Notifications**
   - Once connected, the notifications dashboard will display incoming notifications
   - Click "🔄 Refresh" to manually fetch notifications
   - Notifications are displayed with title, body, and timestamp

5. **View Configuration**
   - Click "📋 Load Configuration" to fetch server configurations
   - Click "Show Raw Data" to see the raw JSON response

## Configuration

### WebSocket URL

Default: `ws://localhost:8080`

You can modify this in the Connection Settings card.

### Client ID

Default: Auto-generated timestamp-based ID (e.g., `client-1234567890`)

This identifies your client to the server.

### Auto Connect

The provider is configured to automatically connect on mount. This can be controlled via the `autoConnect` prop in `App.tsx`.

## Troubleshooting

### Connection Failed

- Ensure the R2 Notify server is running on the configured WebSocket URL
- Check browser console for WebSocket error messages
- Verify network connectivity

### No Notifications Received

- Confirm the server is sending notifications
- Check that your client ID matches the server's expectations
- Review server logs for any error messages

### Stale Configuration

- Click "Load Configuration" again to refresh
- Check browser DevTools Network tab to see server responses

## Project Structure

```
test-app/
├── src/
│   ├── App.tsx                    # Main app component
│   ├── App.css                    # App styles
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles
│   └── components/
│       ├── NotificationsDashboard.tsx
│       └── ConfigurationPanel.tsx
├── index.html                     # HTML template
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.node.json             # TypeScript config for Vite
├── package.json                   # Package configuration
└── README.md                      # This file
```

## Dependencies

- **react** - UI library
- **react-dom** - React DOM rendering
- **r2-notify-react** - React notification provider
- **r2-notify-client** - Core WebSocket client

## DevDependencies

- **vite** - Build tool and dev server
- **@vitejs/plugin-react** - React plugin for Vite

## Styling

The app uses a custom CSS stylesheet with:
- Gradient background (purple theme)
- Card-based layout
- Responsive grid design
- Smooth transitions and animations
- Status badges for connection state
- Notification item styling with hover effects

## Browser Support

- Modern browsers with ES2020 support
- WebSocket support required
- ES6+ JavaScript features

## Contributing

This is a test/sample application. Feel free to modify and extend it for your testing needs.

## License

See the main repository LICENSE file.
