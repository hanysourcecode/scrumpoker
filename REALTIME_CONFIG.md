# Real-time Communication Configuration

This project supports three real-time communication providers:
- **Socket.io** (default) - For traditional server deployments with WebSocket support
- **Pusher** - For serverless deployments (e.g., Netlify)
- **Polling** - HTTP-based polling for environments where WebSockets are not available

## Configuration

### Backend Configuration

Set the `REALTIME_PROVIDER` environment variable to switch between providers:

```bash
# Use Socket.io (default)
REALTIME_PROVIDER=socketio

# Use Pusher
REALTIME_PROVIDER=pusher

# Use Polling
REALTIME_PROVIDER=polling
```

### Pusher Configuration (Backend)

When using Pusher, you need to set the following environment variables:

```bash
REALTIME_PROVIDER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=us2  # or your cluster region
```

### Frontend Configuration

Set the `REACT_APP_REALTIME_PROVIDER` environment variable:

```bash
# Use Socket.io (default)
REACT_APP_REALTIME_PROVIDER=socketio

# Use Pusher
REACT_APP_REALTIME_PROVIDER=pusher

# Use Polling
REACT_APP_REALTIME_PROVIDER=polling
```

### Polling Configuration (Frontend)

When using Polling, you can optionally configure the polling interval:

```bash
REACT_APP_REALTIME_PROVIDER=polling
REACT_APP_POLLING_INTERVAL=2000  # Polling interval in milliseconds (default: 2000ms)
REACT_APP_API_URL=http://localhost:5000  # Your backend API URL
```

### Pusher Configuration (Frontend)

When using Pusher, set these environment variables:

```bash
REACT_APP_REALTIME_PROVIDER=pusher
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=us2  # or your cluster region
REACT_APP_API_URL=https://your-backend-url.com  # Your backend API URL
```

## Getting Pusher Credentials

1. Sign up at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Go to App Keys section
4. Copy your App ID, Key, Secret, and Cluster

## Example .env Files

### Backend .env (Socket.io)
```env
REALTIME_PROVIDER=socketio
PORT=5000
NODE_ENV=production
```

### Backend .env (Pusher)
```env
REALTIME_PROVIDER=pusher
PUSHER_APP_ID=123456
PUSHER_KEY=abc123def456
PUSHER_SECRET=secret789xyz
PUSHER_CLUSTER=us2
PORT=5000
NODE_ENV=production
```

### Backend .env (Polling)
```env
REALTIME_PROVIDER=polling
PORT=5000
NODE_ENV=production
```

### Frontend .env (Socket.io)
```env
REACT_APP_REALTIME_PROVIDER=socketio
REACT_APP_API_URL=http://localhost:5000
```

### Frontend .env (Pusher)
```env
REACT_APP_REALTIME_PROVIDER=pusher
REACT_APP_PUSHER_KEY=abc123def456
REACT_APP_PUSHER_CLUSTER=us2
REACT_APP_API_URL=https://your-backend-url.com
```

### Frontend .env (Polling)
```env
REACT_APP_REALTIME_PROVIDER=polling
REACT_APP_POLLING_INTERVAL=2000
REACT_APP_API_URL=http://localhost:5000
```

## Deployment Scenarios

### Scenario 1: Traditional Deployment (Socket.io)
- Backend: Any Node.js hosting (Railway, Render, Heroku, etc.)
- Frontend: Any static hosting (Netlify, Vercel, etc.)
- Configuration: Use Socket.io on both

### Scenario 2: Serverless Deployment (Pusher)
- Backend: Netlify Functions, Vercel Functions, or any serverless platform
- Frontend: Netlify, Vercel, etc.
- Configuration: Use Pusher on both

### Scenario 3: Hybrid Deployment
- Backend: Traditional Node.js hosting with Socket.io
- Frontend: Netlify with Socket.io
- Configuration: Socket.io on both, backend URL points to your Node.js server

### Scenario 4: Polling Deployment
- Backend: Any Node.js hosting
- Frontend: Any static hosting
- Configuration: Use Polling on both
- Use case: When WebSockets are blocked or not supported (e.g., some corporate firewalls, restrictive networks)

## Polling Details

The polling provider uses HTTP requests to communicate with the server:
- **Long-polling**: Server holds requests for up to 30 seconds waiting for updates
- **Interval polling**: Client polls at configurable intervals (default: 2 seconds)
- **No WebSocket required**: Works in environments where WebSockets are blocked
- **Slightly higher latency**: Compared to WebSocket-based solutions, but more compatible

## Testing

1. **Test Socket.io**: Set `REALTIME_PROVIDER=socketio` and run locally
2. **Test Pusher**: Set `REALTIME_PROVIDER=pusher` with your Pusher credentials
3. **Test Polling**: Set `REALTIME_PROVIDER=polling` and run locally

All providers should work identically from the user's perspective.


